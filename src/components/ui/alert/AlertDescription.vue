<!--
  AlertDescription 组件 - shadcn-vue 官方规范
-->

<script setup lang="ts">
import { cn } from "@/lib/utils"

defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('text-sm [&_p]:leading-relaxed', $props.class)">
    <slot />
  </div>
</template>
