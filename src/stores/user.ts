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
    const isAuthed = computed(() => Boolean(accessToken.value))

    function setToken(token: string | null) {
      accessToken.value = token
    }

    function logout() {
      accessToken.value = null
    }

    return { accessToken, isAuthed, logout, setToken }
  },
  {
    persist: {
      key: "quantum:user",
      paths: ["accessToken"],
    },
  },
)
