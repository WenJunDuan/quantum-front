// {{RIPER-10 Action}}
// Role: LD | Task_ID: #fix-auth-hook | Time: 2025-12-27T00:00:00+08:00
// Principle: Keep domain access patterns consistent.
// Taste: A tiny composable that forwards to the store—no extra magic.

import { storeToRefs } from "pinia"

import { useUserStore } from "@/stores/user"

export function useAuth() {
  const userStore = useUserStore()
  const { accessToken, refreshToken, isAuthed, profile, roles, permissions } =
    storeToRefs(userStore)

  return {
    // State
    accessToken,
    refreshToken,
    isAuthed,
    profile,
    roles,
    permissions,

    // Actions
    setTokens: userStore.setTokens,
    logout: userStore.logout,

    // Permission helpers
    hasRole: userStore.hasRole,
    hasAnyRole: userStore.hasAnyRole,
    hasPermission: userStore.hasPermission,
    hasAnyPermission: userStore.hasAnyPermission,
  }
}
