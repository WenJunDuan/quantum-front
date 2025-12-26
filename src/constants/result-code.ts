// {{RIPER-10 Action}}
// Role: LD | Task_ID: #api-contract | Time: 2025-12-26T00:00:00+08:00
// Principle: Codes are part of the public API surface.
// Taste: Mirror backend naming and values; keep fallbacks deterministic.

export const ResultCode = {
  SUCCESS: 200,

  PARAM_ERROR: 400,
  PARAM_MISSING: 400,
  PARAM_INVALID: 400,
  PARAM_TYPE_ERROR: 400,

  BIZ_ERROR: 400,
  OPERATION_FAILED: 400,

  UNAUTHORIZED: 401,
  TOKEN_EXPIRED: 401,
  TOKEN_INVALID: 401,

  ACCESS_DENIED: 403,
  ACCOUNT_LOCKED: 403,
  ACCOUNT_DISABLED: 403,

  DATA_NOT_FOUND: 404,

  DATA_ALREADY_EXISTS: 409,
  DATA_CONFLICT: 409,
  DUPLICATE_REQUEST: 409,

  RATE_LIMIT_EXCEEDED: 429,

  SYSTEM_ERROR: 500,
  DATABASE_ERROR: 500,
  CACHE_ERROR: 500,
  RPC_ERROR: 500,

  SERVICE_UNAVAILABLE: 503,
  TIMEOUT: 504,
} as const

export type ResultCodeValue = (typeof ResultCode)[keyof typeof ResultCode]

const defaultMessageByCode: Readonly<Record<number, string>> = {
  [ResultCode.SUCCESS]: "操作成功",

  400: "参数错误",
  401: "未认证",
  403: "无权限访问",
  404: "数据不存在",
  409: "数据冲突",
  429: "请求过于频繁",

  500: "系统繁忙，请稍后重试",
  503: "服务不可用",
  504: "请求超时",
}

export function isSuccessCode(code: number) {
  return code === ResultCode.SUCCESS
}

export function isUnauthorizedCode(code: number) {
  return code === ResultCode.UNAUTHORIZED
}

export function getDefaultResultMessage(code: number) {
  return defaultMessageByCode[code] ?? "请求失败"
}
