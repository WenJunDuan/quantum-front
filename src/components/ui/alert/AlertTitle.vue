<!--
  AlertTitle 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { cn } from "@/lib/utils"

defineProps<{ class?: string }>()
</script>

<template>
  <h5 :class="cn('mb-1 leading-none font-medium tracking-tight', $props.class)">
    <slot />
  </h5>
</template>
