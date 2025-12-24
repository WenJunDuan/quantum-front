<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Wrap third-party APIs behind a stable local interface.
Taste: One Iconify wrapper that forwards attrs (class/aria/etc).
-->

<script setup lang="ts">
import { Icon } from "@iconify/vue"

defineProps<{
  icon: string
}>()
</script>

<template>
  <Icon :icon="icon" v-bind="$attrs" />
</template>
