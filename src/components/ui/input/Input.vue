<!--
  Input 组件 - shadcn-vue 官方规范
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
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
        attrs.class,
      )
    "
    :value="modelValue ?? ''"
    @input="onInput"
  />
</template>
