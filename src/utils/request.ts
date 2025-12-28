import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios"
import queryString from "query-string"

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
  // 动态导入避免循环依赖
  import("@/stores/notify")
    .then(({ useNotifyStore }) => useNotifyStore().error(message))
    .catch(() => console.error("[Request]", message))
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

// ==================== Token 刷新 ====================

let isRefreshing = false
let refreshQueue: { resolve: (token: string) => void; reject: (error: unknown) => void }[] = []

type RefreshTokenResult =
  | { status: "success"; token: string }
  | { status: "invalid" }
  | { status: "transient"; error: unknown }

function isInvalidRefreshResponse(status?: number, data?: unknown): boolean {
  if (status === 401 || status === 403) return true
  if (!isBackendEnvelope(data)) return false
  return data.code === ResultCode.UNAUTHORIZED || data.code === ResultCode.ACCESS_DENIED
}

function toRefreshTransientError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new ApiError(ResultCode.SERVICE_UNAVAILABLE, "网络异常，刷新登录状态失败")
    }
    const status = error.response.status
    const message = getDefaultResultMessage(status)
    return new ApiError(status, message)
  }
  return new ApiError(ResultCode.SERVICE_UNAVAILABLE, "网络异常，刷新登录状态失败")
}

async function refreshToken(): Promise<RefreshTokenResult> {
  const userStore = useUserStore()
  const rt = userStore.refreshToken
  if (!rt) return { status: "invalid" }

  try {
    const res = await axios.post<unknown>(`${appConfig.apiBaseUrl}/auth/refresh`, null, {
      params: { refreshToken: rt },
      timeout: 10_000,
    })

    const data = res.data
    if (!isBackendEnvelope(data)) {
      return {
        status: "transient",
        error: new ApiError(ResultCode.SERVICE_UNAVAILABLE, "刷新登录状态失败"),
      }
    }

    if (data.code !== ResultCode.SUCCESS) {
      if (data.code === ResultCode.UNAUTHORIZED || data.code === ResultCode.ACCESS_DENIED) {
        return { status: "invalid" }
      }
      return {
        status: "transient",
        error: new ApiError(data.code, getEnvelopeMessage(data), getEnvelopeTraceId(data)),
      }
    }

    const payload = unwrapEnvelopeData(data)
    if (typeof payload !== "object" || payload === null) {
      return {
        status: "transient",
        error: new ApiError(ResultCode.SERVICE_UNAVAILABLE, "刷新登录状态失败"),
      }
    }
    const record = payload as Record<string, unknown>

    const accessToken = typeof record.accessToken === "string" ? record.accessToken : null
    if (!accessToken) {
      return {
        status: "transient",
        error: new ApiError(ResultCode.SERVICE_UNAVAILABLE, "刷新登录状态失败"),
      }
    }

    const refreshTokenValue =
      typeof record.refreshToken === "string" && record.refreshToken.trim()
        ? record.refreshToken
        : rt

    userStore.setTokens({ accessToken, refreshToken: refreshTokenValue })
    return { status: "success", token: accessToken }
  } catch (error: unknown) {
    if (
      axios.isAxiosError(error) &&
      isInvalidRefreshResponse(error.response?.status, error.response?.data)
    ) {
      return { status: "invalid" }
    }
    return { status: "transient", error: toRefreshTransientError(error) }
  }
}

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

function shouldRedirectOnUnauthorized(config: InternalAxiosRequestConfig) {
  const meta = (config as RequestConfig).meta
  return meta?.skipAuthRedirect !== true
}

function isAuthEndpoint(url: string) {
  return (
    url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/captcha")
  )
}

function flushRefreshQueue(token: string | null, error?: unknown) {
  const queue = refreshQueue
  refreshQueue = []

  for (const item of queue) {
    if (token) item.resolve(token)
    else item.reject(error ?? new ApiError(ResultCode.UNAUTHORIZED, "登录已过期"))
  }
}

async function handleUnauthorized(config: RetryableRequestConfig): Promise<unknown> {
  const url = config.url ?? ""

  // 登录/刷新/验证码接口本身失败：不做刷新，直接当未登录处理
  if (isAuthEndpoint(url)) {
    await clearAuthState()
    if (shouldRedirectOnUnauthorized(config)) redirectToLogin()
    throw new ApiError(ResultCode.UNAUTHORIZED, "登录已过期")
  }

  // 避免无限重试
  if (config._retry) {
    await clearAuthState()
    if (shouldRedirectOnUnauthorized(config)) redirectToLogin()
    throw new ApiError(ResultCode.UNAUTHORIZED, "登录已过期")
  }
  config._retry = true

  // 正在刷新，排队等待
  if (isRefreshing) {
    const token = await new Promise<string>((resolve, reject) => {
      refreshQueue.push({ resolve, reject })
    })

    config.headers["Authorization"] = `Bearer ${token}`
    return instance.request(config)
  }

  // 开始刷新
  isRefreshing = true
  try {
    const refreshResult = await refreshToken()

    if (refreshResult.status === "invalid") {
      const error = new ApiError(ResultCode.UNAUTHORIZED, "登录已过期")
      flushRefreshQueue(null, error)
      await clearAuthState()
      if (shouldRedirectOnUnauthorized(config)) redirectToLogin()
      throw error
    }

    if (refreshResult.status === "transient") {
      flushRefreshQueue(null, refreshResult.error)
      throw refreshResult.error
    }

    const newToken = refreshResult.token

    // 通知排队的请求
    flushRefreshQueue(newToken)

    // 重试当前请求
    config.headers["Authorization"] = `Bearer ${newToken}`
    return instance.request(config)
  } finally {
    isRefreshing = false
  }
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
instance.interceptors.request.use((config) => {
  const meta = (config as RequestConfig).meta
  if (meta?.skipAuth) {
    config.headers.delete("Authorization")
    return config
  }

  const token = useUserStore().accessToken
  if (token && config.headers && !config.headers["Authorization"]) {
    config.headers["Authorization"] = `Bearer ${token}`
  }

  return config
})

// 响应拦截
instance.interceptors.response.use(
  (response) => {
    const data = response.data

    // 非标准响应
    if (!isBackendEnvelope(data)) return data

    // 成功
    if (data.code === ResultCode.SUCCESS) return unwrapEnvelopeData(data)

    // 401
    if (data.code === ResultCode.UNAUTHORIZED) {
      return handleUnauthorized(response.config as RetryableRequestConfig)
    }

    // 业务错误
    if (!(response.config as RequestConfig).meta?.skipErrorToast) {
      showError(getEnvelopeMessage(data))
    }
    return Promise.reject(
      new ApiError(data.code, getEnvelopeMessage(data), getEnvelopeTraceId(data)),
    )
  },
  (error: AxiosError<unknown>) => {
    const config = error.config as RetryableRequestConfig | undefined
    const status = error.response?.status
    const data = error.response?.data

    // HTTP 401
    if (
      config &&
      (status === 401 || (isBackendEnvelope(data) && data.code === ResultCode.UNAUTHORIZED))
    ) {
      return handleUnauthorized(config)
    }

    // 有业务响应
    if (isBackendEnvelope(data)) {
      if (!(config as RequestConfig | undefined)?.meta?.skipErrorToast)
        showError(getEnvelopeMessage(data))
      return Promise.reject(
        new ApiError(data.code, getEnvelopeMessage(data), getEnvelopeTraceId(data)),
      )
    }

    // 网络错误
    const msg = getDefaultResultMessage(status ?? 500)
    if (!(config as RequestConfig | undefined)?.meta?.skipErrorToast) showError(msg)
    return Promise.reject(new ApiError(status ?? 500, msg))
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
