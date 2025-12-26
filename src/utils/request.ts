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
import router from "@/router"
import { useErrorStore } from "@/stores/error"
import { useNotifyStore } from "@/stores/notify"
import { useUserStore } from "@/stores/user"

export interface RequestMeta {
  skipErrorToast?: boolean
  skipErrorRedirect?: boolean
  skipAuthRedirect?: boolean
}

export type RequestConfig = AxiosRequestConfig & {
  meta?: RequestMeta
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
  ;(config as RequestConfig & { __pendingKey?: string }).__pendingKey = key
  return config
}

function detachAbort(config?: RequestConfig) {
  const key = (config as (RequestConfig & { __pendingKey?: string }) | undefined)?.__pendingKey
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

  const currentName = router.currentRoute.value.name
  if (typeof currentName === "string" && currentName.startsWith("error-")) return

  const ttlMs = isFatalRedirectCode(error.code) ? 8000 : 6000
  safeNotifyStore()?.error(error.message, ttlMs)
}

function redirectToLogin(config?: RequestConfig) {
  if (config?.meta?.skipAuthRedirect) return

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

  if (router.currentRoute.value.name === routeName) return

  safeErrorStore()?.setError({
    code: error.code,
    message: error.message,
    traceId: error.traceId,
    timestamp: error.timestamp,
  })

  router.replace({ name: routeName })
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

    this.instance.interceptors.request.use(
      (config) => {
        const token = safeUserStore()?.accessToken

        if (token) {
          config.headers = config.headers ?? {}
          const trimmed = token.trim()
          const authHeader = /^bearer\s+/i.test(trimmed) ? trimmed : `Bearer ${trimmed}`
          config.headers.Authorization = authHeader
        }

        return attachAbort(config as RequestConfig)
      },
      (error: unknown) => {
        const errorObject = error instanceof Error ? error : new Error(String(error))
        return Promise.reject(errorObject)
      },
    )

    this.instance.interceptors.response.use(
      (response) => {
        detachAbort(response.config as RequestConfig)

        const payload: unknown = response.data
        if (!isResult(payload)) return payload

        if (isSuccessCode(payload.code)) return payload.data

        if (isUnauthorizedCode(payload.code)) {
          safeUserStore()?.logout()
          redirectToLogin(response.config as RequestConfig)
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

        const payload: unknown = error.response?.data

        if (isResult(payload)) {
          if (isUnauthorizedCode(payload.code)) {
            safeUserStore()?.logout()
            redirectToLogin(error.config as RequestConfig)
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
            safeUserStore()?.logout()
            redirectToLogin(error.config as RequestConfig)
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

  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }
}

const request = new RequestClient({
  baseURL: appConfig.apiBaseUrl,
})

export default request
