<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #api-contract | Time: 2025-12-26T00:00:00+08:00
Principle: Global UI should be minimal and unobtrusive.
Taste: Small toast host driven by a store.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"

import AppIcon from "@/components/AppIcon.vue"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNotifyStore, type NotifyItem } from "@/stores/notify"

const notify = useNotifyStore()
const { items } = storeToRefs(notify)

function toastIcon(item: NotifyItem) {
  if (item.type === "success") return "radix-icons:check-circled"
  if (item.type === "info") return "radix-icons:info-circled"
  return "radix-icons:exclamation-triangle"
}

function toastClass(item: NotifyItem) {
  if (item.type === "success") return "border-emerald-500/30"
  if (item.type === "info") return "border-blue-500/30"
  return "border-destructive/30"
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 flex w-[22rem] flex-col gap-2">
    <transition-group
      enter-active-class="duration-150 ease-out"
      leave-active-class="duration-150 ease-in"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div
        v-for="item in items"
        :key="item.id"
        :class="
          cn(
            'flex items-start gap-3 rounded-lg border bg-background/90 p-3 shadow-lg backdrop-blur',
            toastClass(item),
          )
        "
        role="status"
      >
        <AppIcon :icon="toastIcon(item)" class="mt-0.5 size-4 text-muted-foreground" />
        <div class="min-w-0 flex-1">
          <p class="text-sm break-words">{{ item.message }}</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          class="h-8 w-8"
          aria-label="Close"
          @click="notify.remove(item.id)"
        >
          <AppIcon icon="radix-icons:cross-2" class="size-4" />
        </Button>
      </div>
    </transition-group>
  </div>
</template>
