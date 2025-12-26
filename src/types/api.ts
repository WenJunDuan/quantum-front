// {{RIPER-10 Action}}
// Role: LD | Task_ID: #api-contract | Time: 2025-12-26T00:00:00+08:00
// Principle: Shared contracts belong in types, not ad-hoc shapes.
// Taste: Keep API types minimal and backend-aligned.

export interface Result<T = unknown> {
  code: number
  message: string
  data?: T
  traceId?: string
  timestamp: number
}

export interface PageResult<T = unknown> {
  pageNum: number
  pageSize: number
  total: number
  pages: number
  records: T[]
}

export type OrderDirection = "asc" | "desc"

export interface PageQuery {
  pageNum?: number
  pageSize?: number
  orderBy?: string
  orderDirection?: OrderDirection
}
