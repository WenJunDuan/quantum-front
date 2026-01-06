<!--
  AlertDialogTrigger 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { AlertDialogTrigger, type AlertDialogTriggerProps } from "reka-ui"

const props = defineProps<AlertDialogTriggerProps>()

defineOptions({ name: "UiAlertDialogTrigger" })
</script>

<template>
  <AlertDialogTrigger v-bind="props">
    <slot />
  </AlertDialogTrigger>
</template>
