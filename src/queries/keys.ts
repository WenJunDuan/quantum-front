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
    user: {
      list: (query: unknown) => ["system", "user", "list", query] as const,
      detail: (userId: number) => ["system", "user", "detail", userId] as const,
    },
    role: {
      list: (query: unknown) => ["system", "role", "list", query] as const,
      detail: (roleId: number) => ["system", "role", "detail", roleId] as const,
      menus: (roleId: number) => ["system", "role", "menus", roleId] as const,
    },
    dept: {
      list: (query: unknown) => ["system", "dept", "list", query] as const,
      treeSelect: (query: unknown) => ["system", "dept", "treeSelect", query] as const,
    },
    dict: {
      typeList: (query: unknown) => ["system", "dict", "type", "list", query] as const,
      dataByType: (dictType: string) => ["system", "dict", "data", "type", dictType] as const,
      dataList: (query: unknown) => ["system", "dict", "data", "list", query] as const,
    },
  },
} as const
