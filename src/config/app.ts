function readBooleanEnv(value: unknown, fallback: boolean): boolean {
  if (typeof value !== "string") return fallback

  const normalized = value.trim().toLowerCase()
  if (!normalized) return fallback

  if (["0", "false", "off", "no"].includes(normalized)) return false
  if (["1", "true", "on", "yes"].includes(normalized)) return true

  return fallback
}

function readNumberEnv(value: unknown, fallback: number, options?: { min?: number; max?: number }) {
  if (typeof value !== "string") return fallback

  const normalized = value.trim()
  if (!normalized) return fallback

  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return fallback

  const min = options?.min
  const max = options?.max

  const bounded =
    typeof min === "number" && typeof max === "number"
      ? Math.min(Math.max(parsed, min), max)
      : typeof min === "number"
        ? Math.max(parsed, min)
        : typeof max === "number"
          ? Math.min(parsed, max)
          : parsed

  return Number.isInteger(bounded) ? bounded : Math.floor(bounded)
}

export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? "Quantum Front",
  description: import.meta.env.VITE_APP_DESCRIPTION ?? "",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",

  enableTabs: readBooleanEnv(import.meta.env.VITE_APP_ENABLE_TABS, true),

  /**
   * When backend is unreachable, clear auth to avoid "offline authed" state.
   * Defaults to enabled; can be overridden by env if needed.
   */
  logoutOnNetworkError: readBooleanEnv(import.meta.env.VITE_APP_AUTH_LOGOUT_ON_NETWORK_ERROR, true),

  /**
   * Logout policy: clear auth after N consecutive unreachable errors.
   */
  logoutOnNetworkErrorMaxConsecutive: readNumberEnv(
    import.meta.env.VITE_APP_AUTH_LOGOUT_ON_NETWORK_ERROR_MAX_CONSECUTIVE,
    1,
    { min: 1, max: 100 },
  ),

  /**
   * Logout policy: clear auth if unreachable lasts >= T seconds (evaluated on next failure).
   */
  logoutOnNetworkErrorMaxOfflineSeconds: readNumberEnv(
    import.meta.env.VITE_APP_AUTH_LOGOUT_ON_NETWORK_ERROR_MAX_OFFLINE_SECONDS,
    60,
    { min: 1, max: 86_400 },
  ),
} as const
