<!--
  AlertDialog 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { AlertDialogRoot, type AlertDialogProps } from "reka-ui"
import { computed, useAttrs } from "vue"

const props = defineProps<AlertDialogProps>()

defineOptions({ name: "UiAlertDialog", inheritAttrs: false })

const attrs = useAttrs()

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = attrs
  return delegated
})
</script>

<template>
  <AlertDialogRoot v-bind="{ ...props, ...delegatedProps }">
    <slot />
  </AlertDialogRoot>
</template>
