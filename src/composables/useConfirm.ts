// {{RIPER-10 Action}}
// Role: LD | Task_ID: #dx-confirm | Time: 2025-12-28T00:00:00+08:00
// Principle: Prefer function call over template boilerplate for confirms.
// Taste: Promise resolves on confirm, rejects on cancel.

import { useConfirmStore, type ConfirmOptions, type ConfirmTone } from "@/stores/confirm"

export function useConfirm(
  message: string,
  tone: ConfirmTone = "default",
  options?: Omit<ConfirmOptions, "message" | "tone">,
) {
  return useConfirmStore().open({ message, tone, ...options })
}
