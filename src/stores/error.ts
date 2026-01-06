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
