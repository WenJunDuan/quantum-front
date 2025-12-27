// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Data first—auth state is a domain concept, not a UI detail.
// Taste: Keep the user store tiny; persistence is opt-in and explicit.

import type { RouterVO, UserInfo } from "@/schemas/auth"

import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useUserStore = defineStore(
  "user",
  () => {
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const isAuthed = computed(() => Boolean(accessToken.value))

    const profile = ref<UserInfo | null>(null)
    const roles = ref<string[]>([])
    const permissions = ref<string[]>([])
    const routers = ref<RouterVO[]>([])
    const isUserInfoLoaded = computed(() => profile.value !== null)
    const areDynamicRoutesReady = ref(false)

    const roleSet = computed(() => new Set(roles.value))
    const permissionSet = computed(() => new Set(permissions.value))

    function setToken(token: string | null) {
      accessToken.value = token
    }

    function setRefreshToken(token: string | null) {
      refreshToken.value = token
    }

    function setTokens(tokens: { accessToken: string; refreshToken?: string | null } | null) {
      if (!tokens) {
        accessToken.value = null
        refreshToken.value = null
        profile.value = null
        roles.value = []
        permissions.value = []
        routers.value = []
        areDynamicRoutesReady.value = false
        return
      }

      accessToken.value = tokens.accessToken
      refreshToken.value = tokens.refreshToken ?? null
    }

    function setUserInfo(info: UserInfo | null) {
      profile.value = info
      roles.value = info?.roles ?? []
      permissions.value = info?.permissions ?? []
      routers.value = info?.routers ?? []
    }

    function clearUserInfo() {
      setUserInfo(null)
      areDynamicRoutesReady.value = false
    }

    function markDynamicRoutesReady() {
      areDynamicRoutesReady.value = true
    }

    function hasAnyRole(required: string[]) {
      if (required.length === 0) return true
      return required.some((role) => roleSet.value.has(role))
    }

    function hasRole(role: string) {
      if (!role) return true
      return roleSet.value.has(role)
    }

    function hasAnyPermission(required: string[]) {
      if (required.length === 0) return true
      if (permissionSet.value.has("*") || permissionSet.value.has("*:*:*")) return true
      return required.some((perm) => permissionSet.value.has(perm))
    }

    function hasPermission(permission: string) {
      if (!permission) return true
      return hasAnyPermission([permission])
    }

    function logout() {
      accessToken.value = null
      refreshToken.value = null
      clearUserInfo()
    }

    return {
      accessToken,
      areDynamicRoutesReady,
      clearUserInfo,
      hasAnyPermission,
      hasAnyRole,
      hasPermission,
      hasRole,
      isAuthed,
      isUserInfoLoaded,
      logout,
      permissions,
      profile,
      refreshToken,
      roles,
      routers,
      markDynamicRoutesReady,
      setRefreshToken,
      setToken,
      setTokens,
      setUserInfo,
    }
  },
  {
    persist: {
      key: "quantum:user",
      paths: ["accessToken", "refreshToken"],
    },
  },
)
