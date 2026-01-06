<!--
  AlertDialogDescription 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { AlertDialogDescription, type AlertDialogDescriptionProps } from "reka-ui"
import { computed, useAttrs } from "vue"

import { cn } from "@/lib/utils"

const props = defineProps<AlertDialogDescriptionProps>()

defineOptions({ name: "UiAlertDialogDescription", inheritAttrs: false })

const attrs = useAttrs()

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = attrs
  return delegated
})

const descriptionClass = computed(() => cn("text-sm text-muted-foreground", attrs.class))
</script>

<template>
  <AlertDialogDescription v-bind="{ ...props, ...delegatedProps }" :class="descriptionClass">
    <slot />
  </AlertDialogDescription>
</template>
