<!--
  AlertDialogCancel 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { AlertDialogCancel, type AlertDialogCancelProps } from "reka-ui"
import { computed, useAttrs } from "vue"

import { cn } from "@/lib/utils"

const props = defineProps<AlertDialogCancelProps>()

defineOptions({ name: "UiAlertDialogCancel", inheritAttrs: false })

const attrs = useAttrs()

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = attrs
  return delegated
})

const cancelClass = computed(() =>
  cn(
    "mt-2 inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors sm:mt-0",
    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    attrs.class,
  ),
)
</script>

<template>
  <AlertDialogCancel v-bind="{ ...props, ...delegatedProps }" :class="cancelClass">
    <slot />
  </AlertDialogCancel>
</template>
