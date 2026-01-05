// src/stores/user.ts
// 用户状态管理

import type { RouterVO, UserInfo } from "@/schemas/auth"

import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useUserStore = defineStore(
  "user",
  () => {
    // ==================== Token ====================

    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const isAuthed = computed(() => Boolean(accessToken.value))

    /**
     * 设置 Token（登录成功后调用）
     */
    function setTokens(tokens: { accessToken: string; refreshToken?: string | null }) {
      accessToken.value = tokens.accessToken
      refreshToken.value = tokens.refreshToken ?? null
    }

    // ==================== 用户信息 ====================

    const profile = ref<UserInfo | null>(null)
    const roles = ref<string[]>([])
    const permissions = ref<string[]>([])
    const routers = ref<RouterVO[]>([])

    const isUserInfoLoaded = computed(() => profile.value !== null)
    const areRoutersLoaded = ref(false)
    const areDynamicRoutesReady = ref(false)

    const roleSet = computed(() => new Set(roles.value))
    const permissionSet = computed(() => new Set(permissions.value))

    function setUserInfo(info: UserInfo | null) {
      profile.value = info
      roles.value = info?.roles ?? []
      permissions.value = info?.permissions ?? []

      const routersFromInfo = info?.routers
      if (Array.isArray(routersFromInfo) && routersFromInfo.length > 0) {
        routers.value = routersFromInfo
        areRoutersLoaded.value = true
      }
    }

    function clearUserInfo() {
      profile.value = null
      roles.value = []
      permissions.value = []
      routers.value = []
      areRoutersLoaded.value = false
      areDynamicRoutesReady.value = false
    }

    function markDynamicRoutesReady() {
      areDynamicRoutesReady.value = true
    }

    function setRouters(next: RouterVO[]) {
      routers.value = Array.isArray(next) ? next : []
      areRoutersLoaded.value = true
    }

    // ==================== 权限判断 ====================

    function hasAnyRole(required: string[]) {
      if (required.length === 0) return true
      return required.some((role) => roleSet.value.has(role))
    }

    function hasRole(role: string) {
      return !role || roleSet.value.has(role)
    }

    function hasAnyPermission(required: string[]) {
      if (required.length === 0) return true
      if (permissionSet.value.has("*") || permissionSet.value.has("*:*:*")) return true
      return required.some((p) => permissionSet.value.has(p))
    }

    function hasPermission(permission: string) {
      return !permission || hasAnyPermission([permission])
    }

    // ==================== 登出 ====================

    function logout() {
      accessToken.value = null
      refreshToken.value = null
      clearUserInfo()
    }

    return {
      // Token
      accessToken,
      refreshToken,
      isAuthed,
      setTokens,

      // User Info
      profile,
      roles,
      permissions,
      routers,
      isUserInfoLoaded,
      areRoutersLoaded,
      areDynamicRoutesReady,
      setUserInfo,
      setRouters,
      clearUserInfo,
      markDynamicRoutesReady,

      // Permission
      hasAnyRole,
      hasRole,
      hasAnyPermission,
      hasPermission,

      // Logout
      logout,
    }
  },
  {
    persist: {
      key: "quantum:user",
      paths: ["accessToken", "refreshToken"],
    },
  },
)
