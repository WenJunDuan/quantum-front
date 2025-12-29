// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Configuration belongs in data, not code.
// Taste: One tiny typed module for all runtime config.

function readBooleanEnv(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback

  const normalized = value.trim().toLowerCase()
  if (!normalized) return fallback

  if (["0", "false", "off", "no"].includes(normalized)) return false
  if (["1", "true", "on", "yes"].includes(normalized)) return true

  return fallback
}

export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? "Quantum Front",
  description: import.meta.env.VITE_APP_DESCRIPTION ?? "",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",

  enableTabs: readBooleanEnv(import.meta.env.VITE_APP_ENABLE_TABS, true),
} as const
