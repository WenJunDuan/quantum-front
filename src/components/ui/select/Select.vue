<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #ui-select | Time: 2026-01-04T00:00:00+08:00
Principle: Avoid native <select> dropdown styling limits.
Taste: Shadcn-like trigger + popover list; small surface area.
-->

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useAttrs } from "vue"

import AppIcon from "@/components/app-icon"
import { cn } from "@/lib/utils"

type SelectValue = string | number

export interface SelectOption<T extends SelectValue = SelectValue> {
  label: string
  value: T
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue?: SelectValue | null
    options: SelectOption[]
    disabled?: boolean
    size?: "default" | "sm"
    placeholder?: string
  }>(),
  {
    modelValue: null,
    disabled: false,
    size: "default",
    placeholder: "请选择",
  },
)

const emit = defineEmits<(e: "update:modelValue", value: SelectValue) => void>()

defineOptions({ name: "UiSelect", inheritAttrs: false })

const attrs = useAttrs()
const rootRef = ref<HTMLDivElement | null>(null)
const open = ref(false)

const listboxId = `ui-select-${Math.random().toString(16).slice(2)}`

const selected = computed(
  () => props.options.find((option) => option.value === props.modelValue) ?? null,
)

function close() {
  open.value = false
}

function toggleOpen() {
  if (props.disabled) return
  open.value = !open.value
}

function onOptionClick(option: SelectOption) {
  if (props.disabled || option.disabled) return
  emit("update:modelValue", option.value)
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") close()
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault()
    toggleOpen()
  }
  if (event.key === "ArrowDown") open.value = true
}

function onDocumentPointerDown(event: Event) {
  if (!open.value) return
  const root = rootRef.value
  const target = event.target as Node | null
  if (!root || !target) return
  if (root.contains(target)) return
  close()
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown)
})

onUnmounted(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown)
})

const delegatedProps = computed(() => {
  const { class: _class, ...delegated } = attrs
  return delegated
})

const rootClass = computed(() => cn("relative", attrs.class))

const triggerClass = computed(() => {
  const base =
    "flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-background/55 shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
  const size = props.size === "sm" ? "h-9 px-3 text-[12px]" : "h-10 px-4 text-[13px]"
  return cn(base, size)
})

const contentClass = computed(() =>
  cn(
    "absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-input bg-popover text-popover-foreground shadow-md",
    props.size === "sm" ? "text-[12px]" : "text-[13px]",
  ),
)
</script>

<template>
  <div ref="rootRef" :class="rootClass">
    <button
      v-bind="delegatedProps"
      type="button"
      class="group"
      :class="triggerClass"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-expanded="open ? 'true' : 'false'"
      @click="toggleOpen"
      @keydown="onKeydown"
    >
      <span
        class="min-w-0 flex-1 truncate"
        :class="selected ? 'text-foreground' : 'text-muted-foreground'"
      >
        {{ selected?.label ?? placeholder }}
      </span>
      <AppIcon
        icon="radix-icons:chevron-down"
        class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
        :class="[open ? 'rotate-180' : 'rotate-0']"
      />
    </button>

    <div v-if="open" :class="contentClass">
      <ul :id="listboxId" role="listbox" class="max-h-72 overflow-auto p-1">
        <li v-for="option in options" :key="String(option.value)" role="option" class="w-full">
          <button
            type="button"
            class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="disabled || option.disabled"
            @click="onOptionClick(option)"
          >
            <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
            <AppIcon
              v-if="option.value === modelValue"
              icon="radix-icons:check"
              class="h-4 w-4 text-primary"
            />
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>
