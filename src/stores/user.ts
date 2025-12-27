// src/stores/user.ts
// 用户状态管理

import type { RouterVO, UserInfo } from "@/schemas/auth"

import { defineStore } from "pinia"
import { computed, ref } from "vue"

import { tokenManager } from "@/utils/token"

export const useUserStore = defineStore("user", () => {
  // ==================== Token ====================

  // 从 localStorage 初始化
  const accessToken = ref<string | null>(tokenManager.getAccessToken())
  const refreshToken = ref<string | null>(tokenManager.getRefreshToken())
  const isAuthed = computed(() => Boolean(accessToken.value))

  /**
   * 设置 Token（登录成功后调用）
   */
  function setTokens(tokens: { accessToken: string; refreshToken?: string | null }) {
    accessToken.value = tokens.accessToken
    refreshToken.value = tokens.refreshToken ?? null

    // 同步到 localStorage
    tokenManager.setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    })
  }

  /**
   * 从 localStorage 同步 Token（用于刷新 Token 后保持 Store 一致）
   */
  function syncTokensFromStorage() {
    accessToken.value = tokenManager.getAccessToken()
    refreshToken.value = tokenManager.getRefreshToken()
  }

  // ==================== 用户信息 ====================

  const profile = ref<UserInfo | null>(null)
  const roles = ref<string[]>([])
  const permissions = ref<string[]>([])
  const routers = ref<RouterVO[]>([])

  const isUserInfoLoaded = computed(() => profile.value !== null)
  const areDynamicRoutesReady = ref(false)

  const roleSet = computed(() => new Set(roles.value))
  const permissionSet = computed(() => new Set(permissions.value))

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
    tokenManager.clear()
  }

  return {
    // Token
    accessToken,
    refreshToken,
    isAuthed,
    setTokens,
    syncTokensFromStorage,

    // User Info
    profile,
    roles,
    permissions,
    routers,
    isUserInfoLoaded,
    areDynamicRoutesReady,
    setUserInfo,
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
})
