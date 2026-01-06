<!--
  AlertDialogHeader 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { computed, useAttrs } from "vue"

import { cn } from "@/lib/utils"

defineOptions({ name: "UiAlertDialogHeader" })

const attrs = useAttrs()
const classes = computed(() => cn("flex flex-col gap-2 text-center sm:text-left", attrs.class))
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
