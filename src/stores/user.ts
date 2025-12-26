// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Data first—auth state is a domain concept, not a UI detail.
// Taste: Keep the user store tiny; persistence is opt-in and explicit.

import { defineStore } from "pinia"
import { computed, ref } from "vue"

export const useUserStore = defineStore(
  "user",
  () => {
    const accessToken = ref<string | null>(null)
    const refreshToken = ref<string | null>(null)
    const isAuthed = computed(() => Boolean(accessToken.value))

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
        return
      }

      accessToken.value = tokens.accessToken
      refreshToken.value = tokens.refreshToken ?? null
    }

    function logout() {
      accessToken.value = null
      refreshToken.value = null
    }

    return { accessToken, isAuthed, logout, refreshToken, setRefreshToken, setToken, setTokens }
  },
  {
    persist: {
      key: "quantum:user",
      paths: ["accessToken", "refreshToken"],
    },
  },
)
