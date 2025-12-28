// {{RIPER-10 Action}}
// Role: LD | Task_ID: #dx-confirm | Time: 2025-12-28T00:00:00+08:00
// Principle: Imperative UX should be composable (Promise-based).
// Taste: Single active confirm; deterministic resolution.

import { defineStore } from "pinia"
import { ref } from "vue"

export type ConfirmTone = "default" | "warning" | "destructive"

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  tone?: ConfirmTone
}

export interface ConfirmState {
  title: string
  message: string
  confirmText: string
  cancelText: string
  tone: ConfirmTone
}

export class ConfirmCanceledError extends Error {
  constructor() {
    super("Confirm canceled")
    this.name = "ConfirmCanceledError"
  }
}

export const useConfirmStore = defineStore("confirm", () => {
  const active = ref<ConfirmState | null>(null)

  let resolveActive: (() => void) | null = null
  let rejectActive: ((error: unknown) => void) | null = null

  function open(options: ConfirmOptions): Promise<void> {
    if (active.value) cancel()

    const tone: ConfirmTone = options.tone ?? "default"
    active.value = {
      title: options.title?.trim() || "请确认",
      message: options.message,
      confirmText: options.confirmText?.trim() || "确认",
      cancelText: options.cancelText?.trim() || "取消",
      tone,
    }

    return new Promise<void>((resolve, reject) => {
      resolveActive = resolve
      rejectActive = reject
    })
  }

  function confirm() {
    if (!active.value) return
    const resolve = resolveActive
    active.value = null
    resolveActive = null
    rejectActive = null
    resolve?.()
  }

  function cancel() {
    if (!active.value) return
    const reject = rejectActive
    active.value = null
    resolveActive = null
    rejectActive = null
    reject?.(new ConfirmCanceledError())
  }

  return { active, cancel, confirm, open }
})
