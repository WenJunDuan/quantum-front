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
