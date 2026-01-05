<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #app-pagination | Time: 2026-01-04T00:00:00+08:00
Principle: Keep pagination UX consistent across pages.
Taste: Minimal shadcn-like controls; pageSize is explicit.
-->

<script setup lang="ts">
import { computed } from "vue"

import AppIcon from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"

interface Props {
  total: number
  totalLabel?: string
  pageNum: number
  pageSize: number
  pages?: number
  pageSizeOptions?: number[]
  disabled?: boolean
  hasPrev?: boolean
  hasNext?: boolean
  showTotalPages?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  pages: 0,
  pageSizeOptions: () => [10, 20, 50, 100],
  disabled: false,
  totalLabel: "共",
  showTotalPages: true,
})

const emit = defineEmits<{
  (e: "update:pageNum", value: number): void
  (e: "update:pageSize", value: number): void
}>()

const pageSizeOptionsNormalized = computed(() =>
  props.pageSizeOptions
    .filter((v) => typeof v === "number" && Number.isFinite(v) && v > 0)
    .map((v) => Math.floor(v))
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .toSorted((a, b) => a - b),
)

const pageSizeSelectOptions = computed(() =>
  pageSizeOptionsNormalized.value.map((size) => ({ label: String(size), value: size })),
)

const maxPages = computed(() => {
  const pages = props.pages
  if (typeof pages === "number" && Number.isFinite(pages) && pages > 0) return Math.floor(pages)

  const total = props.total
  const pageSize = props.pageSize
  if (typeof total === "number" && Number.isFinite(total) && total > 0 && pageSize > 0) {
    return Math.ceil(total / pageSize)
  }

  return 0
})

const canPrev = computed(() => {
  if (props.disabled) return false
  if (typeof props.hasPrev === "boolean") return props.hasPrev
  return props.pageNum > 1
})
const canNext = computed(() => {
  if (props.disabled) return false
  if (typeof props.hasNext === "boolean") return props.hasNext
  if (maxPages.value > 0) return props.pageNum < maxPages.value
  return props.total > 0
})

function gotoPrev() {
  if (!canPrev.value) return
  emit("update:pageNum", props.pageNum - 1)
}

function gotoNext() {
  if (!canNext.value) return
  emit("update:pageNum", props.pageNum + 1)
}

const pageSizeModel = computed({
  get: () => props.pageSize,
  set: (value: number) => {
    emit("update:pageSize", value)
    emit("update:pageNum", 1)
  },
})
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground">
    <div class="flex items-center gap-1">
      <span>{{ totalLabel }}</span>
      <span class="font-medium text-foreground tabular-nums">{{ total }}</span>
      <span>条</span>
    </div>
    <div class="flex-1" />
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="hidden text-[12px] text-muted-foreground sm:inline">每页</span>
        <Select
          v-model="pageSizeModel"
          size="sm"
          class="w-[92px]"
          :disabled="disabled"
          :options="pageSizeSelectOptions"
        />
        <span class="hidden text-[12px] text-muted-foreground sm:inline">条</span>
      </div>

      <div
        class="inline-flex h-9 items-center rounded-lg border border-input bg-background/55 px-1 text-[13px] text-foreground shadow-sm backdrop-blur-sm backdrop-saturate-150"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="h-9 w-9"
          :disabled="!canPrev"
          aria-label="上一页"
          @click="gotoPrev"
        >
          <AppIcon icon="radix-icons:chevron-left" class="h-4 w-4" />
        </Button>

        <div class="flex h-9 min-w-[72px] items-center justify-center px-2 text-center">
          <span class="font-medium text-foreground tabular-nums">{{ pageNum }}</span>
          <template v-if="showTotalPages && maxPages > 0">
            <span class="text-muted-foreground"> / </span>
            <span class="text-muted-foreground tabular-nums">{{ maxPages }}</span>
          </template>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="h-9 w-9"
          :disabled="!canNext"
          aria-label="下一页"
          @click="gotoNext"
        >
          <AppIcon icon="radix-icons:chevron-right" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>
</template>
