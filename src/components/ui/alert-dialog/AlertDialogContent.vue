<!--
  AlertDialogContent 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import {
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  type AlertDialogContentProps,
} from "reka-ui"
import { computed, useAttrs } from "vue"

import { cn } from "@/lib/utils"

const props = defineProps<AlertDialogContentProps>()

defineOptions({ name: "UiAlertDialogContent", inheritAttrs: false })

const attrs = useAttrs()
const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = attrs
  return delegated
})

const contentClass = computed(() =>
  cn(
    "liquid-glass fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 text-popover-foreground",
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
    "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
    "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
    "rounded-2xl",
    attrs.class,
  ),
)
</script>

<template>
  <AlertDialogPortal>
    <AlertDialogOverlay
      class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
    />
    <AlertDialogContent v-bind="{ ...props, ...delegatedProps }" :class="contentClass">
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
