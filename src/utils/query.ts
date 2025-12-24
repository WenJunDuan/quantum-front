// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Prefer proven libraries for edge-heavy string work.
// Taste: One wrapper for consistent query string behavior.

import queryString, { type ParseOptions, type StringifyOptions } from "query-string"

const defaultStringifyOptions: StringifyOptions = {
  arrayFormat: "bracket",
  skipEmptyString: true,
  skipNull: true,
  sort: false,
}

export function stringifyQuery(params: Record<string, unknown>, options?: StringifyOptions) {
  return queryString.stringify(params, { ...defaultStringifyOptions, ...options })
}

export function parseQuery(search: string, options?: ParseOptions) {
  return queryString.parse(search, options)
}
