// src/api/auth.ts
// 认证相关 API

import {
  CaptchaResultSchema,
  LoginResponseSchema,
  UserInfoSchema,
  type CaptchaResult,
  type LoginResponse,
  type UserInfo,
} from "@/schemas/auth"
import request from "@/utils/request"

/**
 * 获取验证码
 */
export async function createCaptcha(): Promise<CaptchaResult> {
  const data = await request.get<unknown>("/auth/captcha", { meta: { skipAuth: true } })
  return CaptchaResultSchema.parse(data)
}

/**
 * 用户登录
 */
export interface LoginPayload {
  username: string
  password: string
  captchaKey: string
  captchaCode: string
  rememberMe?: boolean
}

function normalizeLoginResponse(data: unknown): unknown {
  if (typeof data !== "object" || data === null) return data
  const record = data as Record<string, unknown>

  const accessToken =
    typeof record.accessToken === "string"
      ? record.accessToken
      : typeof record.access_token === "string"
        ? record.access_token
        : null

  if (!accessToken) return data

  const refreshToken =
    typeof record.refreshToken === "string"
      ? record.refreshToken
      : typeof record.refresh_token === "string"
        ? record.refresh_token
        : undefined

  return {
    ...record,
    accessToken,
    ...(refreshToken ? { refreshToken } : {}),
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await request.post<unknown>(
    "/auth/login",
    {
      username: payload.username,
      password: payload.password,
      captchaKey: payload.captchaKey,
      captchaCode: payload.captchaCode,
      rememberMe: payload.rememberMe ?? false,
    },
    {
      meta: { skipAuth: true, skipErrorToast: false, skipAuthRedirect: true },
    },
  )

  return LoginResponseSchema.parse(normalizeLoginResponse(data))
}

/**
 * 获取当前用户信息
 */
export async function getUserInfo(): Promise<UserInfo> {
  const data = await request.get<unknown>("/auth/info")
  return UserInfoSchema.parse(data)
}

/**
 * 用户登出
 */
export async function logout(): Promise<void> {
  try {
    await request.post("/auth/logout", null, {
      meta: { skipErrorToast: true, skipAuthRedirect: true },
    })
  } catch {
    // 忽略登出接口错误
  }
}
