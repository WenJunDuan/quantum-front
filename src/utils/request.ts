// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: IO boundaries must be explicit and testable.
// Taste: One Axios instance with small, predictable interceptors.

import type { Result } from "@/types/api"

import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios"
import { getActivePinia } from "pinia"
import queryString from "query-string"

import { appConfig } from "@/config/app"
import {
  ResultCode,
  getDefaultResultMessage,
  isSuccessCode,
  isUnauthorizedCode,
} from "@/constants/result-code"
import { getAppRouter } from "@/router/navigation"
import { useErrorStore } from "@/stores/error"
import { useNotifyStore } from "@/stores/notify"
import { useUserStore } from "@/stores/user"

export interface RequestMeta {
  skipErrorToast?: boolean
  skipErrorRedirect?: boolean
  skipAuthRedirect?: boolean
  skipTokenRefresh?: boolean
}

export type RequestConfig = AxiosRequestConfig & {
  meta?: RequestMeta
  __pendingKey?: string
  __retryCount?: number
}

export class ApiError<T = unknown> extends Error {
  readonly code: number
  readonly data?: T
  readonly traceId?: string
  readonly timestamp?: number

  constructor(result: Result<T>) {
    super(result.message || getDefaultResultMessage(result.code))
    this.name = "ApiError"
    this.code = result.code
    this.data = result.data
    this.traceId = result.traceId
    this.timestamp = result.timestamp ?? Date.now()
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isResult(value: unknown): value is Result {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value &&
    "timestamp" in value &&
    typeof (value as { code: unknown }).code === "number" &&
    typeof (value as { message: unknown }).message === "string" &&
    typeof (value as { timestamp: unknown }).timestamp === "number"
  )
}

function safeUserStore() {
  if (!getActivePinia()) return null
  try {
    return useUserStore()
  } catch {
    return null
  }
}

function persistedAccessToken() {
  try {
    if (!("localStorage" in globalThis)) return null
    const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage
    if (!storage) return null

    const raw = storage.getItem("quantum:user")
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null

    const token = parsed.accessToken
    if (typeof token !== "string") return null

    const trimmed = token.trim()
    return trimmed || null
  } catch {
    return null
  }
}

function persistedRefreshToken() {
  try {
    if (!("localStorage" in globalThis)) return null
    const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage
    if (!storage) return null

    const raw = storage.getItem("quantum:user")
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null

    const token = parsed.refreshToken
    if (typeof token !== "string") return null

    const trimmed = token.trim()
    return trimmed || null
  } catch {
    return null
  }
}

function safeNotifyStore() {
  if (!getActivePinia()) return null
  try {
    return useNotifyStore()
  } catch {
    return null
  }
}

function safeErrorStore() {
  if (!getActivePinia()) return null
  try {
    return useErrorStore()
  } catch {
    return null
  }
}

function requestKey(config: RequestConfig) {
  const method = (config.method ?? "get").toLowerCase()
  const urlPath = config.url ?? ""
  const url = config.baseURL ? `${config.baseURL}${urlPath}` : urlPath

  const params =
    config.params == null
      ? ""
      : queryString.stringify(isRecord(config.params) ? config.params : {}, { sort: false })

  const data =
    typeof config.data === "string" ? config.data : config.data ? JSON.stringify(config.data) : ""

  return `${method}:${url}?${params}:${data}`
}

const pending = new Map<string, AbortController>()

function attachAbort(config: RequestConfig) {
  const key = requestKey(config)
  if (!key) return config

  const previous = pending.get(key)
  if (previous) previous.abort("deduped")

  const controller = new AbortController()
  pending.set(key, controller)

  config.signal = controller.signal
  config.__pendingKey = key
  return config
}

function detachAbort(config?: RequestConfig) {
  const key = config?.__pendingKey
  if (!key) return
  pending.delete(key)
}

function isFatalRedirectCode(code: number) {
  return code === 400 || code === 404 || code >= 500
}

function errorRouteNameByCode(code: number) {
  if (code === 400) return "error-400"
  if (code === 404) return "error-404"
  if (code >= 500) return "error-500"
  return null
}

function notifyApiError(error: ApiError, config?: RequestConfig) {
  if (config?.meta?.skipErrorToast) return

  const router = getAppRouter()
  const currentName = router?.currentRoute.value.name
  if (typeof currentName === "string" && currentName.startsWith("error-")) return

  const ttlMs = isFatalRedirectCode(error.code) ? 8000 : 6000
  safeNotifyStore()?.error(error.message, ttlMs)
}

function redirectToLogin(config?: RequestConfig) {
  if (config?.meta?.skipAuthRedirect) return

  const router = getAppRouter()
  if (!router) return

  const current = router.currentRoute.value
  if (current.name === "login") return

  router.replace({
    name: "login",
    query: { redirect: current.fullPath },
  })
}

function redirectToErrorPage(error: ApiError, config?: RequestConfig) {
  if (config?.meta?.skipErrorRedirect) return

  const routeName = errorRouteNameByCode(error.code)
  if (!routeName) return

  const router = getAppRouter()
  if (!router) return

  if (router.currentRoute.value.name === routeName) return

  safeErrorStore()?.setError({
    code: error.code,
    message: error.message,
    traceId: error.traceId,
    timestamp: error.timestamp,
  })

  router.replace({ name: routeName })
}

function setAuthHeader(config: AxiosRequestConfig, authHeader: string) {
  const headers = config.headers

  if (!headers) {
    config.headers = { Authorization: authHeader }
    return
  }

  const maybeHeaders = headers as unknown as {
    set?: (headerName: string, value: string) => void
    Authorization?: string
    common?: Record<string, unknown>
    delete?: Record<string, unknown>
    get?: Record<string, unknown>
    head?: Record<string, unknown>
    options?: Record<string, unknown>
    patch?: Record<string, unknown>
    post?: Record<string, unknown>
    put?: Record<string, unknown>
  }

  if (typeof maybeHeaders.set === "function") {
    maybeHeaders.set("Authorization", authHeader)
    return
  }

  maybeHeaders.Authorization = authHeader

  const method = typeof config.method === "string" ? config.method.toLowerCase() : null
  const buckets = ["common", method].filter((value): value is string => typeof value === "string")

  for (const bucket of buckets) {
    const group = (maybeHeaders as unknown as Record<string, unknown>)[bucket]
    if (isRecord(group)) {
      ;(group as Record<string, unknown>).Authorization = authHeader
    }
  }
}

function normalizeBearerAuthorization(token: string) {
  const trimmed = token.trim()
  if (!trimmed) return null

  if (/^bearer\b/i.test(trimmed)) {
    const withoutPrefix = trimmed.replace(/^bearer\b/i, "").trimStart()
    if (!withoutPrefix) return null
    return `Bearer ${withoutPrefix}`
  }

  return `Bearer ${trimmed}`
}

function shouldSkipTokenRefresh(config?: RequestConfig) {
  if (config?.meta?.skipTokenRefresh) return true

  const url = config?.url
  if (typeof url !== "string") return false

  return (
    url.includes("/auth/login") || url.includes("/auth/captcha") || url.includes("/auth/refresh")
  )
}

let isRefreshing = false
let pendingRequests: {
  resolve: (token: string) => void
  reject: (error: Error) => void
}[] = []

interface TokenResponse {
  accessToken: string
  refreshToken?: string
}

function normalizeApiBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, "")
}

function toTokenResponse(value: unknown): TokenResponse | null {
  if (!isRecord(value)) return null

  const accessToken = value.accessToken
  if (typeof accessToken !== "string" || !accessToken.trim()) return null

  const refreshToken =
    typeof value.refreshToken === "string" && value.refreshToken.trim()
      ? value.refreshToken
      : undefined

  return { accessToken, refreshToken }
}

function persistTokens(tokens: TokenResponse) {
  try {
    if (!("localStorage" in globalThis)) return
    const storage = (globalThis as unknown as { localStorage?: Storage }).localStorage
    if (!storage) return

    const raw = storage.getItem("quantum:user")
    if (!raw) return

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return
    ;(parsed as Record<string, unknown>).accessToken = tokens.accessToken
    if (tokens.refreshToken) {
      ;(parsed as Record<string, unknown>).refreshToken = tokens.refreshToken
    }

    storage.setItem("quantum:user", JSON.stringify(parsed))
  } catch {
    return
  }
}

async function refreshAccessToken(): Promise<TokenResponse | null> {
  const refreshToken = safeUserStore()?.refreshToken ?? persistedRefreshToken()
  if (!refreshToken) return null

  try {
    const response = await axios.post<Result<unknown>>(
      `${normalizeApiBaseUrl(appConfig.apiBaseUrl)}/auth/refresh`,
      null,
      {
        params: { refreshToken },
        timeout: 10_000,
      },
    )

    const result = response.data
    if (!isSuccessCode(result.code) || !result.data) {
      return null
    }

    const tokens = toTokenResponse(result.data)
    if (!tokens) return null

    const userStore = safeUserStore()
    if (userStore) {
      userStore.setToken(tokens.accessToken)
      if (tokens.refreshToken) userStore.setRefreshToken(tokens.refreshToken)
    } else {
      persistTokens(tokens)
    }

    return tokens
  } catch {
    return null
  }
}

function handleUnauthorized(config?: RequestConfig): Promise<never> {
  const error = new ApiError({
    code: ResultCode.UNAUTHORIZED,
    message: "登录已过期，请重新登录",
    timestamp: Date.now(),
  })

  for (const { reject } of pendingRequests) {
    reject(error)
  }
  pendingRequests = []

  safeUserStore()?.logout()
  redirectToLogin(config)

  return Promise.reject(error)
}

class RequestClient {
  readonly instance: AxiosInstance

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create({
      timeout: 10_000,
      ...config,
      paramsSerializer: {
        serialize(params) {
          return queryString.stringify(params ?? {}, {
            arrayFormat: "bracket",
            skipEmptyString: true,
            skipNull: true,
            sort: false,
          })
        },
      },
    })

    this.setupRequestInterceptor()
    this.setupResponseInterceptor()
  }

  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(
      (config) => {
        const token = safeUserStore()?.accessToken ?? persistedAccessToken()

        if (token) {
          const authHeader = normalizeBearerAuthorization(token)
          if (authHeader) setAuthHeader(config, authHeader)
        }

        return attachAbort(config as RequestConfig)
      },
      (error: unknown) => {
        const errorObject = error instanceof Error ? error : new Error(String(error))
        return Promise.reject(errorObject)
      },
    )
  }

  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      (response) => {
        detachAbort(response.config as RequestConfig)

        const payload: unknown = response.data
        if (!isResult(payload)) return payload

        if (isSuccessCode(payload.code)) return payload.data

        if (isUnauthorizedCode(payload.code)) {
          const config = response.config as RequestConfig

          if (shouldSkipTokenRefresh(config)) {
            const apiError = new ApiError(payload)
            notifyApiError(apiError, config)
            return Promise.reject(apiError)
          }

          return this.handleTokenRefresh(config)
        }

        const apiError = new ApiError(payload)
        notifyApiError(apiError, response.config as RequestConfig)
        if (isFatalRedirectCode(apiError.code)) {
          redirectToErrorPage(apiError, response.config as RequestConfig)
        }
        return Promise.reject(apiError)
      },
      (error: AxiosError) => {
        detachAbort(error.config as RequestConfig)

        if (axios.isCancel(error)) {
          return Promise.reject(error)
        }

        const payload: unknown = error.response?.data

        if (isResult(payload)) {
          if (isUnauthorizedCode(payload.code)) {
            const config = error.config as RequestConfig | undefined

            if (shouldSkipTokenRefresh(config)) {
              const apiError = new ApiError(payload)
              notifyApiError(apiError, config)
              return Promise.reject(apiError)
            }

            return this.handleTokenRefresh(config)
          }

          const apiError = new ApiError(payload)
          notifyApiError(apiError, error.config as RequestConfig)
          if (isFatalRedirectCode(apiError.code)) {
            redirectToErrorPage(apiError, error.config as RequestConfig)
          }
          return Promise.reject(apiError)
        }

        const status = error.response?.status
        if (typeof status === "number" && status > 0) {
          if (status === ResultCode.UNAUTHORIZED) {
            const config = error.config as RequestConfig | undefined
            if (shouldSkipTokenRefresh(config)) {
              return handleUnauthorized(config)
            }
            return this.handleTokenRefresh(config)
          }

          const apiError = new ApiError({
            code: status,
            message: getDefaultResultMessage(status),
            timestamp: Date.now(),
          })
          notifyApiError(apiError, error.config as RequestConfig)
          if (isFatalRedirectCode(apiError.code)) {
            redirectToErrorPage(apiError, error.config as RequestConfig)
          }
          return Promise.reject(apiError)
        }

        const errorObject = error instanceof Error ? error : new Error(String(error))
        if (!(error.config as RequestConfig | undefined)?.meta?.skipErrorToast) {
          safeNotifyStore()?.error(errorObject.message)
        }
        return Promise.reject(errorObject)
      },
    )
  }

  private async handleTokenRefresh<T>(config?: RequestConfig): Promise<T> {
    if (!config) return handleUnauthorized()

    const retryCount = config.__retryCount ?? 0
    if (retryCount >= 1) {
      return handleUnauthorized(config)
    }

    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        pendingRequests.push({
          resolve: (newToken: string) => {
            config.__retryCount = retryCount + 1
            const authHeader = normalizeBearerAuthorization(newToken)
            if (authHeader) setAuthHeader(config, authHeader)
            delete config.__pendingKey
            this.instance.request<unknown, T>(config).then(resolve).catch(reject)
          },
          reject,
        })
      })
    }

    isRefreshing = true

    try {
      const tokens = await refreshAccessToken()

      if (!tokens) {
        return handleUnauthorized(config)
      }

      for (const { resolve } of pendingRequests) resolve(tokens.accessToken)
      pendingRequests = []

      config.__retryCount = retryCount + 1
      const authHeader = normalizeBearerAuthorization(tokens.accessToken)
      if (authHeader) setAuthHeader(config, authHeader)
      delete config.__pendingKey
      return this.instance.request<unknown, T>(config)
    } catch {
      return handleUnauthorized(config)
    } finally {
      isRefreshing = false
    }
  }

  request<T = unknown>(config: RequestConfig): Promise<T> {
    return this.instance.request<unknown, T>(config)
  }

  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.instance.patch(url, data, config)
  }

  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }
}

const request = new RequestClient({
  baseURL: appConfig.apiBaseUrl,
})

export default request
