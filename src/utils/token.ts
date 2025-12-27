// src/utils/token.ts
// Token 存储 - 直接操作 localStorage，不依赖 Pinia

const STORAGE_KEY = "quantum:auth"

export interface TokenPair {
  accessToken: string
  refreshToken?: string | null
}

/**
 * Token 存储管理
 */
export const tokenManager = {
  /**
   * 获取 AccessToken
   */
  getAccessToken(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw) as TokenPair
      return data.accessToken || null
    } catch {
      return null
    }
  },

  /**
   * 获取 RefreshToken
   */
  getRefreshToken(): string | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw) as TokenPair
      return data.refreshToken || null
    } catch {
      return null
    }
  },

  /**
   * 保存 Token
   */
  setTokens(tokens: TokenPair): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
      console.log("[TokenManager] Saved tokens to localStorage")
    } catch (error) {
      console.error("[TokenManager] Failed to save tokens:", error)
    }
  },

  /**
   * 更新 AccessToken（刷新时用）
   */
  updateAccessToken(accessToken: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const data: TokenPair = raw ? JSON.parse(raw) : {}
      data.accessToken = accessToken
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // ignore
    }
  },

  /**
   * 清除 Token
   */
  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      console.log("[TokenManager] Cleared tokens")
    } catch {
      // ignore
    }
  },

  /**
   * 是否已登录
   */
  isLoggedIn(): boolean {
    return Boolean(this.getAccessToken())
  },
}
