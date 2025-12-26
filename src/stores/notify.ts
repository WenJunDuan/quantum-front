// {{RIPER-10 Action}}
// Role: LD | Task_ID: #api-contract | Time: 2025-12-26T00:00:00+08:00
// Principle: Notify is UI state, but must be globally accessible.
// Taste: Small store, predictable lifecycle (auto-dismiss).

import { defineStore } from "pinia"
import { ref } from "vue"

export type NotifyType = "error" | "info" | "success"

export interface NotifyItem {
  id: string
  type: NotifyType
  message: string
  createdAt: number
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useNotifyStore = defineStore("notify", () => {
  const items = ref<NotifyItem[]>([])

  function remove(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function push(type: NotifyType, message: string, ttlMs = 4000) {
    const id = createId()
    const createdAt = Date.now()
    items.value = [{ id, type, message, createdAt }, ...items.value].slice(0, 5)

    globalThis.setTimeout(() => {
      remove(id)
    }, ttlMs)
  }

  function error(message: string, ttlMs?: number) {
    push("error", message, ttlMs ?? 6000)
  }

  function info(message: string, ttlMs?: number) {
    push("info", message, ttlMs ?? 4000)
  }

  function success(message: string, ttlMs?: number) {
    push("success", message, ttlMs ?? 3000)
  }

  function clear() {
    items.value = []
  }

  return { clear, error, info, items, remove, success }
})
