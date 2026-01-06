<!--
  Sonner Toaster 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { computed } from "vue"
import { Toaster as Sonner, type ToasterProps } from "vue-sonner"

import { useAppColorMode } from "@/composables/useAppColorMode"

const props = defineProps<Partial<ToasterProps>>()

defineOptions({ name: "UiToaster" })

const { isDark } = useAppColorMode()

const theme = computed(() => props.theme ?? (isDark.value ? "dark" : "light"))

const toastOptions = computed(() => {
  const base = props.toastOptions ?? {}

  return {
    ...base,
    unstyled: true,
    classes: {
      toast:
        "liquid-glass flex w-full items-start gap-3 rounded-xl border border-border p-3 text-foreground shadow-sm",
      title: "text-sm font-medium leading-snug",
      description: "text-xs text-muted-foreground leading-snug",
      actionButton:
        "inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90",
      cancelButton:
        "inline-flex h-8 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground",
      closeButton: "text-muted-foreground hover:text-foreground rounded-md p-1 transition-colors",
      ...(base as { classes?: Record<string, string> }).classes,
    },
  }
})
</script>

<template>
  <Sonner v-bind="props" :theme="theme" :toast-options="toastOptions" />
</template>
