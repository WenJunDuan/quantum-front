// {{RIPER-10 Action}}
// Role: LD | Task_ID: #login | Time: 2025-12-26T00:00:00+08:00
// Principle: Keep API functions thin and typed.
// Taste: Parse server data with Zod at the boundary.

import {
  CaptchaResultSchema,
  LoginResponseSchema,
  UserInfoSchema,
  type CaptchaResult,
  type LoginResponse,
  type UserInfo,
} from "@/schemas/auth"
import request, { type RequestConfig } from "@/utils/request"

export async function createCaptcha(config?: RequestConfig): Promise<CaptchaResult> {
  const data = await request.get<unknown>("/auth/captcha", config)
  return CaptchaResultSchema.parse(data)
}

export interface LoginPayload {
  username: string
  password: string
  captchaKey: string
  captchaCode: string
  rememberMe?: boolean
}

export async function login(payload: LoginPayload, config?: RequestConfig): Promise<LoginResponse> {
  const body = {
    username: payload.username,
    password: payload.password,
    captchaKey: payload.captchaKey,
    captchaCode: payload.captchaCode,
    captcha: payload.captchaCode,
    key: payload.captchaKey,
    code: payload.captchaCode,
    rememberMe: payload.rememberMe,
    rememberPassword: payload.rememberMe,
  }

  const data = await request.post<unknown>("/auth/login", body, {
    ...config,
    meta: { ...config?.meta, skipErrorRedirect: true },
  })

  return LoginResponseSchema.parse(data)
}

export async function getUserInfo(config?: RequestConfig): Promise<UserInfo> {
  const data = await request.get<unknown>("/auth/info", config)
  return UserInfoSchema.parse(data)
}
