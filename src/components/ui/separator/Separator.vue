<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Provide semantic separators with minimal props.
Taste: Orientation is explicit; default is horizontal.
-->

<script setup lang="ts">
import { computed } from "vue"

const props = withDefaults(
  defineProps<{
    orientation?: "horizontal" | "vertical"
  }>(),
  { orientation: "horizontal" },
)

const classes = computed(() => {
  if (props.orientation === "vertical") return "h-full w-px"
  return "h-px w-full"
})
</script>

<template>
  <div role="separator" :aria-orientation="orientation" :class="['shrink-0 bg-border', classes]" />
</template>
