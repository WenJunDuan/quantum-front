<!--
  AlertDialogTitle 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { AlertDialogTitle, type AlertDialogTitleProps } from "reka-ui"
import { computed, useAttrs } from "vue"

import { cn } from "@/lib/utils"

const props = defineProps<AlertDialogTitleProps>()

defineOptions({ name: "UiAlertDialogTitle", inheritAttrs: false })

const attrs = useAttrs()

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = attrs
  return delegated
})

const titleClass = computed(() => cn("text-lg font-semibold", attrs.class))
</script>

<template>
  <AlertDialogTitle v-bind="{ ...props, ...delegatedProps }" :class="titleClass">
    <slot />
  </AlertDialogTitle>
</template>
