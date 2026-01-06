import axios, { type AxiosError, type AxiosRequestConfig } from "axios"
import queryString from "query-string"
import { toast } from "vue-sonner"

import { appConfig } from "@/config/app"
import { ResultCode, getDefaultResultMessage } from "@/constants/result-code"
import { getAppRouter } from "@/router/navigation"
import { useUserStore } from "@/stores/user"

// ==================== 类型 ====================

export interface RequestMeta {
  skipErrorToast?: boolean
  skipAuthRedirect?: boolean
  skipAuth?: boolean
}

export type RequestConfig = AxiosRequestConfig & { meta?: RequestMeta }

export class ApiError extends Error {
  readonly code: number
  readonly traceId?: string

  constructor(code: number, message: string, traceId?: string) {
    super(message)
    this.name = "ApiError"
    this.code = code
    this.traceId = traceId
  }
}

// ==================== 辅助函数 ====================

type BackendEnvelope = Record<string, unknown> & {
  code: number
  message?: unknown
  msg?: unknown
  data?: unknown
  traceId?: unknown
}

function isBackendEnvelope(value: unknown): value is BackendEnvelope {
  if (typeof value !== "object" || value === null) return false
  const record = value as Record<string, unknown>
  return typeof record.code === "number"
}

function getEnvelopeMessage(envelope: BackendEnvelope) {
  const message = envelope.message
  if (typeof message === "string" && message.trim()) return message
  const msg = envelope.msg
  if (typeof msg === "string" && msg.trim()) return msg
  return "请求失败"
}

function getEnvelopeTraceId(envelope: BackendEnvelope): string | undefined {
  return typeof envelope.traceId === "string" && envelope.traceId.trim()
    ? envelope.traceId
    : undefined
}

function unwrapEnvelopeData(envelope: BackendEnvelope): unknown {
  if (Object.prototype.hasOwnProperty.call(envelope, "data")) {
    const data = envelope.data
    if (data !== undefined) return data
  }
  return envelope
}

function showError(message: string) {
  toast.error(message)
}

function redirectToLogin() {
  const router = getAppRouter()
  if (!router) return

  const current = router.currentRoute.value
  if (current.name === "login") return

  router.replace({
    name: "login",
    query: current.fullPath === "/" ? undefined : { redirect: current.fullPath },
  })
}

async function clearAuthState() {
  useUserStore().logout()
}

function readHeaderValue(headers: unknown, name: string): string | null {
  if (!headers) return null

  const lowerName = name.toLowerCase()
  const record = headers as Record<string, unknown>

  const axiosGet = (headers as { get?: (key: string) => unknown }).get
  if (typeof axiosGet === "function") {
    const value = axiosGet.call(headers, name) ?? axiosGet.call(headers, lowerName)
    if (typeof value === "string") return value.trim() || null
    if (Array.isArray(value)) {
      const joined = value.filter((item): item is string => typeof item === "string").join(",")
      return joined.trim() || null
    }
  }

  const direct = record[name] ?? record[lowerName]
  if (typeof direct === "string") return direct.trim() || null
  if (Array.isArray(direct)) {
    const joined = direct.filter((item): item is string => typeof item === "string").join(",")
    return joined.trim() || null
  }

  return null
}

function parseBearerToken(value: string): string | null {
  const trimmed = value.trim()
  const match = /^\s*Bearer\s+(.+)\s*$/i.exec(trimmed)
  if (!match) return null
  const token = match[1]?.trim()
  return token || null
}

function syncTokensFromHeaders(headers: unknown) {
  const auth = readHeaderValue(headers, "Authorization")
  const accessToken = auth ? parseBearerToken(auth) : null
  const refreshToken = readHeaderValue(headers, "X-Refresh-Token")

  if (!accessToken && !refreshToken) return

  const userStore = useUserStore()
  const currentAccessToken = userStore.accessToken
  const currentRefreshToken = userStore.refreshToken

  if (accessToken) {
    userStore.setTokens({
      accessToken,
      refreshToken: refreshToken ?? currentRefreshToken ?? null,
    })
    return
  }

  if (refreshToken && currentAccessToken) {
    userStore.setTokens({
      accessToken: currentAccessToken,
      refreshToken,
    })
  }
}

// ==================== Network Fail-safe ====================

let isClearingAuthOnNetworkError = false
let lastNetworkAuthClearAt = 0
const NETWORK_AUTH_CLEAR_THROTTLE_MS = 2000

let consecutiveUnreachableAuthFailures = 0
let firstUnreachableAuthFailureAt = 0

let offlineLogoutTimerId: number | null = null

function clearOfflineLogoutTimer() {
  if (offlineLogoutTimerId === null) return
  globalThis.clearTimeout(offlineLogoutTimerId)
  offlineLogoutTimerId = null
}

function resetUnreachableAuthFailureState() {
  consecutiveUnreachableAuthFailures = 0
  firstUnreachableAuthFailureAt = 0
  clearOfflineLogoutTimer()
}

async function handleOfflineLogoutTimer(startedAt: number) {
  offlineLogoutTimerId = null

  if (!appConfig.logoutOnNetworkError) {
    resetUnreachableAuthFailureState()
    return
  }

  const userStore = useUserStore()
  const token = userStore.accessToken
  const refreshToken = userStore.refreshToken
  if (
    !token ||
    consecutiveUnreachableAuthFailures === 0 ||
    firstUnreachableAuthFailureAt !== startedAt
  ) {
    resetUnreachableAuthFailureState()
    return
  }

  let logoutMessage = `服务不可用（离线超过 ${appConfig.logoutOnNetworkErrorMaxOfflineSeconds}s），登录状态已清除`
  try {
    const res = await axios.get<unknown>(`${appConfig.apiBaseUrl}/auth/info`, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...(refreshToken ? { "X-Refresh-Token": refreshToken } : {}),
      },
      timeout: 8000,
      validateStatus: () => true,
    })

    syncTokensFromHeaders(res.headers)

    const status = res.status
    const data = res.data
    const isUnauthorized =
      status === 401 ||
      status === 403 ||
      (isBackendEnvelope(data) &&
        (data.code === ResultCode.UNAUTHORIZED || data.code === ResultCode.ACCESS_DENIED))

    if (!isUnauthorized) {
      resetUnreachableAuthFailureState()
      return
    }

    logoutMessage = "登录已过期，请重新登录"
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      resetUnreachableAuthFailureState()
      return
    }
  }

  const now = Date.now()
  if (
    isClearingAuthOnNetworkError ||
    now - lastNetworkAuthClearAt < NETWORK_AUTH_CLEAR_THROTTLE_MS
  ) {
    return
  }

  isClearingAuthOnNetworkError = true
  lastNetworkAuthClearAt = now
  try {
    await clearAuthState()
    resetUnreachableAuthFailureState()
    showError(logoutMessage)
    redirectToLogin()
  } finally {
    isClearingAuthOnNetworkError = false
  }
}

function scheduleOfflineLogoutTimer(startedAt: number) {
  const delayMs = appConfig.logoutOnNetworkErrorMaxOfflineSeconds * 1000
  if (delayMs <= 0) return
  if (offlineLogoutTimerId !== null) return

  offlineLogoutTimerId = globalThis.setTimeout(() => {
    void handleOfflineLogoutTimer(startedAt)
  }, delayMs)
}

function isLogoutWorthyNetworkError(error: AxiosError<unknown>) {
  if (error.response) return false
  if (error.code === "ERR_CANCELED") return false
  if (error.code === "ECONNABORTED") return false
  return true
}

function shouldClearAuthByNetworkPolicy(now: number) {
  const maxConsecutive = appConfig.logoutOnNetworkErrorMaxConsecutive
  const maxOfflineMs = appConfig.logoutOnNetworkErrorMaxOfflineSeconds * 1000

  if (consecutiveUnreachableAuthFailures >= maxConsecutive) {
    return { shouldClear: true, reason: "count" as const }
  }

  if (firstUnreachableAuthFailureAt > 0 && now - firstUnreachableAuthFailureAt >= maxOfflineMs) {
    return { shouldClear: true, reason: "offline" as const }
  }

  return { shouldClear: false as const }
}

async function maybeLogoutOnNetworkError(config?: AxiosRequestConfig): Promise<boolean> {
  if (!appConfig.logoutOnNetworkError) return false
  if (!config) return false

  const meta = (config as RequestConfig).meta
  if (meta?.skipAuth) return false

  const userStore = useUserStore()
  if (!userStore.accessToken) {
    resetUnreachableAuthFailureState()
    return false
  }

  const now = Date.now()
  if (
    isClearingAuthOnNetworkError ||
    now - lastNetworkAuthClearAt < NETWORK_AUTH_CLEAR_THROTTLE_MS
  ) {
    return true
  }

  if (consecutiveUnreachableAuthFailures === 0) {
    firstUnreachableAuthFailureAt = now
    scheduleOfflineLogoutTimer(now)
  }
  consecutiveUnreachableAuthFailures += 1

  const policy = shouldClearAuthByNetworkPolicy(now)
  if (!policy.shouldClear) {
    if (!meta?.skipErrorToast && consecutiveUnreachableAuthFailures === 1) {
      showError(
        `服务不可用（1/${appConfig.logoutOnNetworkErrorMaxConsecutive}），持续离线 ${appConfig.logoutOnNetworkErrorMaxOfflineSeconds}s 将退出登录`,
      )
    }
    return true
  }

  isClearingAuthOnNetworkError = true
  lastNetworkAuthClearAt = now
  try {
    await clearAuthState()
    resetUnreachableAuthFailureState()

    if (!meta?.skipErrorToast) {
      const reasonText =
        policy.reason === "count"
          ? `连续失败达到 ${appConfig.logoutOnNetworkErrorMaxConsecutive} 次`
          : `离线超过 ${appConfig.logoutOnNetworkErrorMaxOfflineSeconds}s`
      showError(`服务不可用（${reasonText}），登录状态已清除`)
    }
    if (shouldRedirectOnUnauthorized(config)) redirectToLogin()
    return true
  } finally {
    isClearingAuthOnNetworkError = false
  }
}

// ==================== Unauthorized ====================

function shouldRedirectOnUnauthorized(config?: AxiosRequestConfig) {
  const meta = (config as RequestConfig | undefined)?.meta
  return meta?.skipAuthRedirect !== true
}

async function handleUnauthorized(config: AxiosRequestConfig, message: string) {
  const meta = (config as RequestConfig).meta

  // `skipAuth` 场景（如登录/验证码）不把 401 当作“登录过期”处理
  if (meta?.skipAuth) {
    throw new ApiError(ResultCode.UNAUTHORIZED, message)
  }

  await clearAuthState()
  if (shouldRedirectOnUnauthorized(config)) redirectToLogin()
  throw new ApiError(ResultCode.UNAUTHORIZED, message)
}

// ==================== Axios 实例 ====================

const instance = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 15_000,
  paramsSerializer: {
    serialize: (params) =>
      queryString.stringify(params, {
        arrayFormat: "bracket",
        skipNull: true,
        skipEmptyString: true,
      }),
  },
})

// 请求拦截：添加 Token
instance.interceptors.request.use(async (config) => {
  const meta = (config as RequestConfig).meta
  if (meta?.skipAuth) {
    const headers = config.headers as unknown as {
      delete?: (key: string) => void
      [key: string]: unknown
    }

    if (headers) {
      if (typeof headers.delete === "function") {
        headers.delete("Authorization")
        headers.delete("X-Refresh-Token")
      } else {
        delete headers.Authorization
        delete headers.authorization
        delete headers["X-Refresh-Token"]
        delete headers["x-refresh-token"]
      }
    }
    return config
  }

  const userStore = useUserStore()
  await userStore.hydrateTokens()
  const accessToken = userStore.accessToken
  const refreshToken = userStore.refreshToken

  if (accessToken && config.headers && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${accessToken}`
  }

  if (refreshToken && config.headers && !config.headers["X-Refresh-Token"]) {
    config.headers["X-Refresh-Token"] = refreshToken
  }

  return config
})

// 响应拦截
instance.interceptors.response.use(
  (response) => {
    resetUnreachableAuthFailureState()
    syncTokensFromHeaders(response.headers)
    const data = response.data

    // 非标准响应
    if (!isBackendEnvelope(data)) return data

    // 成功
    if (data.code === ResultCode.SUCCESS) return unwrapEnvelopeData(data)

    // 401
    if (data.code === ResultCode.UNAUTHORIZED) {
      return handleUnauthorized(response.config, getEnvelopeMessage(data))
    }

    // 业务错误
    if (!(response.config as RequestConfig).meta?.skipErrorToast) {
      showError(getEnvelopeMessage(data))
    }
    return Promise.reject(
      new ApiError(data.code, getEnvelopeMessage(data), getEnvelopeTraceId(data)),
    )
  },
  async (error: AxiosError<unknown>) => {
    const config = error.config as AxiosRequestConfig | undefined
    const status = error.response?.status
    const data = error.response?.data

    if (error.response) {
      resetUnreachableAuthFailureState()
      syncTokensFromHeaders(error.response.headers)
    }

    // HTTP 401
    if (
      config &&
      (status === 401 || (isBackendEnvelope(data) && data.code === ResultCode.UNAUTHORIZED))
    ) {
      const message = isBackendEnvelope(data) ? getEnvelopeMessage(data) : "登录已过期"
      return handleUnauthorized(config, message)
    }

    // 有业务响应
    if (isBackendEnvelope(data)) {
      if (!(config as RequestConfig | undefined)?.meta?.skipErrorToast)
        showError(getEnvelopeMessage(data))
      throw new ApiError(data.code, getEnvelopeMessage(data), getEnvelopeTraceId(data))
    }

    // 网络错误
    const meta = (config as RequestConfig | undefined)?.meta
    const isNetworkError = !error.response
    const resolvedCode = status ?? (isNetworkError ? ResultCode.SERVICE_UNAVAILABLE : 500)
    const msg = getDefaultResultMessage(resolvedCode)

    if (isLogoutWorthyNetworkError(error)) {
      const handled = await maybeLogoutOnNetworkError(config)
      if (!handled && !meta?.skipErrorToast) showError(msg)
      throw new ApiError(resolvedCode, msg)
    }

    if (!meta?.skipErrorToast) showError(msg)
    throw new ApiError(resolvedCode, msg)
  },
)

// ==================== 导出 ====================

const request = {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return instance.get(url, config)
  },
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.post(url, data, config)
  },
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.put(url, data, config)
  },
  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return instance.patch(url, data, config)
  },
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return instance.delete(url, config)
  },
}

export default request
