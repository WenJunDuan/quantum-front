<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #dx-confirm | Time: 2025-12-28T00:00:00+08:00
Principle: Global imperative UI lives in a host component.
Taste: Minimal confirm modal; accessible defaults.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, onBeforeUnmount, watch } from "vue"

import { Button } from "@/components/ui/button"
import { useConfirmStore } from "@/stores/confirm"

const confirm = useConfirmStore()
const { active } = storeToRefs(confirm)

const confirmButtonVariant = computed(() => {
  if (active.value?.tone === "destructive") return "destructive"
  return "default"
})

const confirmButtonClass = computed(() => {
  if (active.value?.tone !== "warning") return ""
  return "bg-amber-500 text-white hover:bg-amber-500/90"
})

function onKeydown(event: KeyboardEvent) {
  if (!active.value) return
  if (event.key === "Escape") confirm.cancel()
  if (event.key === "Enter") confirm.confirm()
}

watch(
  active,
  (next) => {
    if (next) globalThis.addEventListener("keydown", onKeydown)
    else globalThis.removeEventListener("keydown", onKeydown)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  globalThis.removeEventListener("keydown", onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <transition
      enter-active-class="duration-150 ease-out"
      leave-active-class="duration-150 ease-in"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="active"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        @click.self="confirm.cancel()"
      >
        <div class="w-full max-w-md rounded-lg border bg-background p-4 shadow-xl">
          <div class="text-base font-semibold">{{ active.title }}</div>
          <p class="mt-2 text-sm break-words whitespace-pre-wrap text-muted-foreground">
            {{ active.message }}
          </p>

          <div class="mt-4 flex justify-end gap-2">
            <Button variant="outline" @click="confirm.cancel()">{{ active.cancelText }}</Button>
            <Button
              :variant="confirmButtonVariant"
              :class="confirmButtonClass"
              @click="confirm.confirm()"
            >
              {{ active.confirmText }}
            </Button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>
