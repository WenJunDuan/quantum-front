// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: IO boundaries must be explicit and testable.
// Taste: One Axios instance with small, predictable interceptors.

import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from "axios"
import { getActivePinia } from "pinia"
import queryString from "query-string"

import { appConfig } from "@/config/app"
import { useUserStore } from "@/stores/user"

export interface ApiResult<T = unknown> {
  code: number
  message?: string
  data: T
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isApiResult(value: unknown): value is ApiResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "data" in value &&
    typeof (value as { code: unknown }).code === "number"
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

function requestKey(config: AxiosRequestConfig) {
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

function attachAbort(config: AxiosRequestConfig) {
  const key = requestKey(config)
  if (!key) return config

  const previous = pending.get(key)
  if (previous) previous.abort("deduped")

  const controller = new AbortController()
  pending.set(key, controller)

  config.signal = controller.signal
  ;(config as AxiosRequestConfig & { __pendingKey?: string }).__pendingKey = key
  return config
}

function detachAbort(config?: AxiosRequestConfig) {
  const key = (config as (AxiosRequestConfig & { __pendingKey?: string }) | undefined)?.__pendingKey
  if (!key) return
  pending.delete(key)
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
          config.headers.Authorization = `Bearer ${token}`
        }

        return attachAbort(config)
      },
      (error: unknown) => {
        const errorObject = error instanceof Error ? error : new Error(String(error))
        return Promise.reject(errorObject)
      },
    )

    this.instance.interceptors.response.use(
      (response) => {
        detachAbort(response.config)

        const payload: unknown = response.data
        if (!isApiResult(payload)) return payload

        if (payload.code === 200) return payload.data

        if (payload.code === 401) {
          safeUserStore()?.logout()
        }

        const message = payload.message ?? "Request failed"
        return Promise.reject(new Error(message))
      },
      (error: AxiosError) => {
        detachAbort(error.config)

        const errorObject = error instanceof Error ? error : new Error(String(error))
        return Promise.reject(errorObject)
      },
    )
  }

  request<T = unknown>(config: AxiosRequestConfig): Promise<T> {
    return this.instance.request<unknown, T>(config)
  }

  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config)
  }

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.post(url, data, config)
  }

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put(url, data, config)
  }

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config)
  }
}

const request = new RequestClient({
  baseURL: appConfig.apiBaseUrl,
})

export default request
