// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Keep domain access patterns consistent.
// Taste: A tiny composable that forwards to the store—no extra magic.

import { storeToRefs } from "pinia"

import { useUserStore } from "@/stores/user"

export function useAuth() {
  const userStore = useUserStore()
  const { accessToken, isAuthed } = storeToRefs(userStore)

  return {
    accessToken,
    isAuthed,
    setToken: userStore.setToken,
    logout: userStore.logout,
  }
}
