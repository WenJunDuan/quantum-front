// {{RIPER-10 Action}}
// Role: LD | Task_ID: #dx-table | Time: 2025-12-28T00:00:00+08:00
// Principle: Table state should survive refresh (URL is the source of truth).
// Taste: Small URL↔state sync helper; reset page on filter changes.

import { reactive, watch } from "vue"
import { useRoute, useRouter, type LocationQueryRaw } from "vue-router"

type QueryValue = string | number | boolean | null | undefined
type QueryShape = Record<string, QueryValue>

function firstQueryValue(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (Array.isArray(value) && typeof value[0] === "string") return value[0]
  return undefined
}

function coerceValue(value: unknown, fallback: QueryValue): QueryValue {
  const raw = firstQueryValue(value)
  if (raw === undefined) return fallback

  if (typeof fallback === "number") {
    const num = Number(raw)
    return Number.isFinite(num) ? num : fallback
  }
  if (typeof fallback === "boolean") {
    return raw === "1" || raw === "true"
  }
  if (typeof fallback === "string") {
    return raw
  }
  return raw
}

function toLocationQuery(value: QueryValue): string | undefined {
  if (value === null || value === undefined) return undefined
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : undefined
  if (typeof value === "boolean") return value ? "1" : "0"
  const trimmed = value.trim()
  return trimmed || undefined
}

function buildQueryRaw(state: QueryShape): LocationQueryRaw {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(state)) {
    const normalized = toLocationQuery(value)
    if (normalized !== undefined) query[key] = normalized
  }
  return query
}

export function useTable<T extends QueryShape>(defaults: T) {
  const route = useRoute()
  const router = useRouter()

  const query = reactive({ ...defaults }) as T

  function syncFromRoute() {
    for (const key of Object.keys(defaults)) {
      query[key] = coerceValue(route.query[key], defaults[key]) as T[Extract<keyof T, string>]
    }
  }

  function syncToRoute() {
    void router.replace({
      query: buildQueryRaw(query),
    })
  }

  function setPage(pageNum: number) {
    if (!("pageNum" in query)) return
    query.pageNum = pageNum as T[Extract<keyof T, "pageNum">]
    syncToRoute()
  }

  function setPageSize(pageSize: number) {
    if (!("pageSize" in query)) return
    query.pageSize = pageSize as T[Extract<keyof T, "pageSize">]
    if ("pageNum" in query) query.pageNum = 1 as T[Extract<keyof T, "pageNum">]
    syncToRoute()
  }

  function apply(partial: Partial<T>) {
    Object.assign(query, partial)
    if ("pageNum" in query) query.pageNum = 1 as T[Extract<keyof T, "pageNum">]
    syncToRoute()
  }

  watch(
    () => route.query,
    () => syncFromRoute(),
    { immediate: true },
  )

  return { apply, query, setPage, setPageSize, syncFromRoute, syncToRoute }
}
