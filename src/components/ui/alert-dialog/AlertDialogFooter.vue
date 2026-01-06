<!--
  AlertDialogFooter 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { computed, useAttrs } from "vue"

import { cn } from "@/lib/utils"

defineOptions({ name: "UiAlertDialogFooter" })

const attrs = useAttrs()
const classes = computed(() =>
  cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", attrs.class),
)
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
