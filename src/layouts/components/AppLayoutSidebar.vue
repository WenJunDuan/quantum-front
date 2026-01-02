<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #layout-split | Time: 2025-12-29T00:00:00+08:00
Principle: Layout is composition; keep pieces small.
Taste: Sidebar is navigation + branding only.
-->

<script setup lang="ts">
import type { RouterVO } from "@/schemas/auth"

import { computed, onMounted, ref, watch } from "vue"
import { RouterLink, useRoute } from "vue-router"

import AppIcon from "@/components/app-icon"
import AppMenuTree from "@/components/app-menu-tree"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { appConfig } from "@/config/app"

const props = defineProps<{
  isOpen: boolean
  isCollapsed: boolean
  routers: RouterVO[]
}>()

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()

const GENERAL_GROUP_KEY = "quantum:sidebar:general-open"
const isGeneralOpen = ref(true)

const isDashboardActive = computed(() => route.path === "/")

function toggleGeneralGroup() {
  isGeneralOpen.value = !isGeneralOpen.value
}

onMounted(() => {
  const saved = localStorage.getItem(GENERAL_GROUP_KEY)
  if (saved === "0") isGeneralOpen.value = false
})

watch(isGeneralOpen, (value) => {
  localStorage.setItem(GENERAL_GROUP_KEY, value ? "1" : "0")
})
</script>

<template>
  <aside
    class="absolute inset-y-0 left-0 z-50 flex w-[18rem] -translate-x-full flex-col bg-card/75 shadow-[12px_0_34px_-22px_rgba(0,0,0,0.35)] ring-1 ring-foreground/5 backdrop-blur-xl backdrop-saturate-150 transition-transform duration-[var(--motion-duration-slow)] ease-[var(--motion-ease-spring)] will-change-transform supports-[backdrop-filter]:bg-card/65 lg:static lg:z-auto lg:translate-x-0"
    :class="[props.isOpen ? 'translate-x-0' : '', props.isCollapsed ? 'lg:w-16' : 'lg:w-[18rem]']"
  >
    <div class="flex h-14 items-center gap-2 px-3" :class="[props.isCollapsed ? 'lg:px-2' : '']">
      <RouterLink
        to="/"
        title="返回首页"
        class="group flex h-11 min-w-0 flex-1 items-center justify-center gap-3 rounded-xl px-2 py-1 transition-[background,box-shadow,transform] hover:-translate-y-px hover:bg-accent/60 hover:shadow-sm"
      >
        <div
          class="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
        >
          <AppIcon icon="radix-icons:dashboard" class="h-4 w-4" />
        </div>

        <div v-if="!props.isCollapsed" class="min-w-0 py-0.5 text-center leading-tight">
          <div class="truncate text-[13px] font-semibold tracking-tight">{{ appConfig.title }}</div>
          <div class="truncate text-[11px] text-muted-foreground">Vite + shadcn-vue</div>
        </div>
      </RouterLink>

      <Button
        variant="ghost"
        size="icon"
        class="rounded-full lg:hidden"
        aria-label="Close sidebar"
        @click="emit('close')"
      >
        <AppIcon icon="radix-icons:cross-1" class="h-4 w-4" />
      </Button>
    </div>

    <Separator class="opacity-10" />

    <nav
      class="flex-1 overflow-auto px-2 py-3"
      :class="[props.isCollapsed ? 'lg:px-1' : '']"
      aria-label="Sidebar"
    >
      <Button
        as-child
        variant="ghost"
        class="h-11 w-full rounded-lg text-[13px] font-medium"
        :class="[
          props.isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 pr-3',
          isDashboardActive
            ? 'bg-accent text-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm',
        ]"
      >
        <RouterLink
          to="/"
          :title="props.isCollapsed ? 'Dashboard' : undefined"
          class="flex w-full items-center"
          :class="[props.isCollapsed ? 'justify-center' : 'gap-3 pl-3']"
        >
          <AppIcon
            icon="radix-icons:home"
            class="h-4 w-4"
            :class="[isDashboardActive ? 'text-primary' : 'text-muted-foreground']"
          />
          <span v-if="!props.isCollapsed">Dashboard</span>
          <span v-else class="sr-only">Dashboard</span>
        </RouterLink>
      </Button>

      <div class="mt-2">
        <button
          type="button"
          class="group flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-[background,box-shadow,transform] hover:-translate-y-px hover:bg-accent hover:text-foreground hover:shadow-sm"
          :class="[props.isCollapsed ? 'justify-center px-0' : '']"
          :title="props.isCollapsed ? 'General' : undefined"
          :aria-expanded="isGeneralOpen"
          aria-controls="general-group"
          @click="toggleGeneralGroup"
        >
          <AppIcon icon="radix-icons:layers" class="h-4 w-4" />

          <span v-if="!props.isCollapsed" class="flex-1 text-left">General</span>
          <span v-else class="sr-only">General</span>

          <AppIcon
            v-if="!props.isCollapsed"
            icon="radix-icons:chevron-down"
            class="h-4 w-4 text-muted-foreground transition-transform"
            :class="[isGeneralOpen ? 'rotate-0' : '-rotate-90']"
          />
        </button>

        <div v-show="isGeneralOpen" id="general-group" class="mt-2">
          <AppMenuTree :items="props.routers" :collapsed="props.isCollapsed" />
        </div>
      </div>
    </nav>

    <div class="h-3" />
  </aside>
</template>
