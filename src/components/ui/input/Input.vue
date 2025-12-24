<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Inputs are controlled values; keep behavior predictable.
Taste: A thin wrapper that supports v-model + attrs.
-->

<script setup lang="ts">
defineProps<{
  modelValue?: string | number | null
}>()

const emit = defineEmits<(e: "update:modelValue", value: string) => void>()

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit("update:modelValue", target.value)
}
</script>

<template>
  <input
    class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
    :value="modelValue ?? ''"
    @input="onInput"
  />
</template>
