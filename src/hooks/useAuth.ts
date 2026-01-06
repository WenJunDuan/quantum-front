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
