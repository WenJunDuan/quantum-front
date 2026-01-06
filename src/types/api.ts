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
