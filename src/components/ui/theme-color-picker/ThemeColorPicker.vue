<script setup lang="ts">
import { useThemeColor, type ThemeColor } from "@/composables/useThemeColor"
import { cn } from "@/lib/utils"

const { themeColor, setThemeColor } = useThemeColor()

const colors: { value: ThemeColor; label: string; class: string }[] = [
  { value: "default", label: "Default", class: "bg-neutral-900 dark:bg-neutral-50" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "violet", label: "Violet", class: "bg-violet-500" },
]
</script>

<template>
  <div class="grid grid-cols-4 place-items-center gap-3">
    <button
      v-for="color in colors"
      :key="color.value"
      type="button"
      :title="color.label"
      :class="
        cn(
          'h-8 w-8 rounded-full transition-all',
          'ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
          color.class,
          themeColor === color.value && 'ring-2 ring-ring ring-offset-2',
        )
      "
      @click="setThemeColor(color.value)"
    >
      <span class="sr-only">{{ color.label }}</span>
    </button>
  </div>
</template>
