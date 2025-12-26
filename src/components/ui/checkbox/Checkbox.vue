<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #login | Time: 2025-12-26T00:00:00+08:00
Principle: Checkbox should be predictable and accessible.
Taste: Minimal wrapper matching shadcn-vue-style tokens.
-->

<script setup lang="ts">
defineProps<{
  modelValue?: boolean
}>()

const emit = defineEmits<(e: "update:modelValue", value: boolean) => void>()

function onChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit("update:modelValue", target.checked)
}
</script>

<template>
  <input
    type="checkbox"
    class="size-4 rounded border border-input bg-background text-primary shadow-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    :checked="modelValue ?? false"
    @change="onChange"
  />
</template>
