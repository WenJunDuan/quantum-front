<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Inputs are controlled values; keep behavior predictable.
Taste: A thin wrapper that supports v-model + attrs.
-->

<script setup lang="ts">
import { computed, useAttrs } from "vue"

import { cn } from "@/lib/utils"

defineProps<{
  modelValue?: string | number | null
}>()

const emit = defineEmits<(e: "update:modelValue", value: string) => void>()

defineOptions({ name: "UiInput", inheritAttrs: false })

const attrs = useAttrs()

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = attrs
  return delegated
})

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit("update:modelValue", target.value)
}
</script>

<template>
  <input
    v-bind="delegatedProps"
    :class="
      cn(
        'flex h-11 w-full rounded-lg border border-input bg-background/55 px-4 py-2 text-[13px] shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 supports-[backdrop-filter]:bg-background/45',
        attrs.class,
      )
    "
    :value="modelValue ?? ''"
    @input="onInput"
  />
</template>
