<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #layout-split | Time: 2025-12-29T00:00:00+08:00
Principle: Layout is composition; keep pieces small.
Taste: Sidebar is navigation + branding only.
-->

<script setup lang="ts">
import type { RouterVO } from "@/schemas/auth"

import { computed, ref, watch } from "vue"
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

const DYNAMIC_GROUP_KEY_PREFIX = "quantum:sidebar:dynamic-open:"
const dynamicGroupOpen = ref<Record<string, boolean>>({})

const DEFAULT_ICON = "radix-icons:dot-filled"

function normalizePathSegment(path: string) {
  const trimmed = path.trim()
  if (!trimmed || trimmed === "/") return ""
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "")
}

function joinPath(parent: string, child: string) {
  const childTrimmed = child.trim()
  if (!childTrimmed) return parent || "/"

  if (/^https?:\/\//i.test(childTrimmed)) return childTrimmed
  if (childTrimmed.startsWith("/")) return childTrimmed

  const base = parent.replace(/\/+$/, "")
  const seg = normalizePathSegment(childTrimmed)
  return base ? `${base}/${seg}` : `/${seg}`
}

function resolveIcon(icon?: string) {
  const value = typeof icon === "string" ? icon.trim() : ""
  if (!value) return null
  if (value.includes(":")) return value
  return `radix-icons:${value}`
}

function isActivePath(targetPath: string) {
  const currentPath = route.path
  if (targetPath === "/") return currentPath === "/"
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}

function toSafeDomId(value: string) {
  const normalized = value.trim().toLowerCase()
  const cleaned = normalized
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
  return cleaned ? `menu-group-${cleaned}` : "menu-group"
}

const isDashboardActive = computed(() => isActivePath("/"))

interface DynamicGroup {
  title: string
  icon: string | null
  fullPath: string
  children: RouterVO[]
  isGroup: boolean
}

function isLayoutComponent(component?: string) {
  const value = typeof component === "string" ? component.trim().toLowerCase() : ""
  return value === "layout" || value === "parentview" || value === "routerview"
}

const dynamicGroups = computed<DynamicGroup[]>(() =>
  props.routers
    .filter((item) => item.hidden !== true)
    .map((item) => {
      const title = item.meta?.title ?? item.name ?? item.path
      const fullPath = joinPath("", item.path)
      const icon = resolveIcon(item.meta?.icon)
      const children = Array.isArray(item.children) ? item.children : []
      const isGroup = children.length > 0 || isLayoutComponent(item.component)

      return {
        title: title.trim() || "未命名菜单",
        fullPath,
        icon,
        children,
        isGroup,
      }
    }),
)

function getDynamicGroupStorageKey(fullPath: string) {
  return `${DYNAMIC_GROUP_KEY_PREFIX}${fullPath}`
}

function isDynamicGroupOpen(fullPath: string) {
  return dynamicGroupOpen.value[fullPath] !== false
}

function setDynamicGroupOpen(fullPath: string, value: boolean) {
  dynamicGroupOpen.value = { ...dynamicGroupOpen.value, [fullPath]: value }
  localStorage.setItem(getDynamicGroupStorageKey(fullPath), value ? "1" : "0")
}

function toggleDynamicGroup(fullPath: string) {
  setDynamicGroupOpen(fullPath, !isDynamicGroupOpen(fullPath))
}

watch(
  dynamicGroups,
  (groups) => {
    const next = { ...dynamicGroupOpen.value }
    for (const group of groups) {
      if (!group.isGroup) continue
      if (Object.prototype.hasOwnProperty.call(next, group.fullPath)) continue

      const saved = localStorage.getItem(getDynamicGroupStorageKey(group.fullPath))
      next[group.fullPath] = saved === "0" ? false : true
    }
    dynamicGroupOpen.value = next
  },
  { immediate: true },
)
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
        <div v-for="group in dynamicGroups" :key="group.fullPath" class="mt-2">
          <div v-if="group.isGroup">
            <button
              type="button"
              class="group flex h-11 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-[background,box-shadow,transform] hover:-translate-y-px hover:bg-accent hover:text-foreground hover:shadow-sm"
              :class="[props.isCollapsed ? 'justify-center px-0' : '']"
              :title="props.isCollapsed ? group.title : undefined"
              :aria-expanded="isDynamicGroupOpen(group.fullPath)"
              :aria-controls="toSafeDomId(group.fullPath)"
              @click="toggleDynamicGroup(group.fullPath)"
            >
              <AppIcon :icon="group.icon ?? DEFAULT_ICON" class="h-4 w-4" />

              <span v-if="!props.isCollapsed" class="flex-1 text-left">{{ group.title }}</span>
              <span v-else class="sr-only">{{ group.title }}</span>

              <AppIcon
                v-if="!props.isCollapsed"
                icon="radix-icons:chevron-down"
                class="h-4 w-4 text-muted-foreground transition-transform"
                :class="[isDynamicGroupOpen(group.fullPath) ? 'rotate-0' : '-rotate-90']"
              />
            </button>

            <div
              v-show="isDynamicGroupOpen(group.fullPath)"
              :id="toSafeDomId(group.fullPath)"
              class="mt-2"
            >
              <AppMenuTree
                v-if="group.children.length > 0"
                :items="group.children"
                :parent-path="group.fullPath"
                :collapsed="props.isCollapsed"
              />
              <div
                v-else-if="!props.isCollapsed"
                class="px-3 py-2 text-[12px] text-muted-foreground"
              >
                暂无子菜单
              </div>
            </div>
          </div>

          <Button
            v-else
            as-child
            variant="ghost"
            class="h-11 w-full rounded-lg text-[13px] font-medium"
            :class="[
              props.isCollapsed ? 'justify-center px-0' : 'justify-start gap-3 pr-3',
              isActivePath(group.fullPath)
                ? 'bg-accent text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm',
            ]"
          >
            <RouterLink
              :to="group.fullPath"
              :title="props.isCollapsed ? group.title : undefined"
              class="flex w-full items-center"
              :class="[props.isCollapsed ? 'justify-center' : 'gap-3 pl-3']"
            >
              <AppIcon
                :icon="group.icon ?? DEFAULT_ICON"
                class="h-4 w-4"
                :class="[isActivePath(group.fullPath) ? 'text-primary' : 'text-muted-foreground']"
              />
              <span v-if="!props.isCollapsed">{{ group.title }}</span>
              <span v-else class="sr-only">{{ group.title }}</span>
            </RouterLink>
          </Button>
        </div>
      </div>
    </nav>

    <div class="h-3" />
  </aside>
</template>
