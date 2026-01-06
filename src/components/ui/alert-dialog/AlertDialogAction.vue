<!--
  AlertDialogAction 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { AlertDialogAction, type AlertDialogActionProps } from "reka-ui"
import { computed, useAttrs } from "vue"

import { cn } from "@/lib/utils"

const props = defineProps<AlertDialogActionProps>()

defineOptions({ name: "UiAlertDialogAction", inheritAttrs: false })

const attrs = useAttrs()

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = attrs
  return delegated
})

const actionClass = computed(() =>
  cn(
    "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors",
    "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    attrs.class,
  ),
)
</script>

<template>
  <AlertDialogAction v-bind="{ ...props, ...delegatedProps }" :class="actionClass">
    <slot />
  </AlertDialogAction>
</template>
