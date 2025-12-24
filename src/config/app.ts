// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Configuration belongs in data, not code.
// Taste: One tiny typed module for all runtime config.

export const appConfig = {
  title: import.meta.env.VITE_APP_TITLE ?? "Quantum Front",
  description: import.meta.env.VITE_APP_DESCRIPTION ?? "",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
} as const
