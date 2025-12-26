// {{RIPER-10 Action}}
// Role: LD | Task_ID: #api-contract | Time: 2025-12-26T00:00:00+08:00
// Principle: Error context should be centralized.
// Taste: Keep only the last fatal error for error pages.

import { defineStore } from "pinia"
import { ref } from "vue"

export interface ErrorInfo {
  code: number
  message: string
  traceId?: string
  timestamp?: number
}

export const useErrorStore = defineStore("error", () => {
  const lastError = ref<ErrorInfo | null>(null)

  function setError(error: ErrorInfo) {
    lastError.value = error
  }

  function clearError() {
    lastError.value = null
  }

  return { clearError, lastError, setError }
})
