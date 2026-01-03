// {{RIPER-10 Action}}
// Role: LD | Task_ID: #dx-vue-query | Time: 2025-12-28T00:00:00+08:00
// Principle: Query keys are public API; keep them stable and typed.
// Taste: Small key factories; avoid ad-hoc arrays in components.

export const queryKeys = {
  auth: {
    captcha: () => ["auth", "captcha"] as const,
    userInfo: () => ["auth", "userInfo"] as const,
  },
  system: {
    menu: {
      tree: () => ["system", "menu", "tree"] as const,
      detail: (menuId: number) => ["system", "menu", "detail", menuId] as const,
    },
  },
} as const
