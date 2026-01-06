<!--
  Sidebar 组件 - shadcn-vue 官方规范
  
  修改点：
  - 宽度: w-[18rem] → w-64
  - 背景: 移除 backdrop-blur，使用简洁 bg-background
  - 边框: ring-1 → border-r
  - 菜单项高度: h-11 → h-9
  - 字体: text-[13px] → text-sm
  - 圆角: rounded-lg → 默认
  - 激活态: 移除 shadow-sm
-->

<script setup lang="ts">
import type { RouterVO } from "@/schemas/auth"

import { computed, ref, watch } from "vue"
import { RouterLink, useRoute } from "vue-router"

import AppIcon from "@/components/app-icon"
import AppMenuTree from "@/components/app-menu-tree"
import { Button } from "@/components/ui/button"
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
    class="fixed inset-y-0 left-0 z-50 flex w-64 -translate-x-full flex-col border-r bg-card transition-transform lg:static lg:z-auto lg:translate-x-0"
    :class="[props.isOpen ? 'translate-x-0' : '', props.isCollapsed ? 'lg:w-16' : 'lg:w-64']"
  >
    <!-- Logo 区域 -->
    <div
      class="flex h-14 items-center gap-2 border-b px-4"
      :class="[props.isCollapsed ? 'lg:justify-center lg:px-2' : '']"
    >
      <RouterLink to="/" title="返回首页" class="flex items-center gap-3">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
        >
          <AppIcon icon="radix-icons:dashboard" class="h-4 w-4" />
        </div>

        <div v-if="!props.isCollapsed" class="min-w-0">
          <div class="truncate text-sm font-semibold tracking-tight">{{ appConfig.title }}</div>
        </div>
      </RouterLink>

      <Button
        v-if="!props.isCollapsed"
        variant="ghost"
        size="icon"
        class="ml-auto lg:hidden"
        aria-label="Close sidebar"
        @click="emit('close')"
      >
        <AppIcon icon="radix-icons:cross-1" class="h-4 w-4" />
      </Button>
    </div>

    <!-- 导航区域 -->
    <nav
      class="flex-1 overflow-auto p-2"
      :class="[props.isCollapsed ? 'lg:px-2' : '']"
      aria-label="Sidebar"
    >
      <!-- Dashboard 首页 -->
      <Button
        as-child
        variant="ghost"
        class="h-9 w-full justify-start"
        :class="[
          props.isCollapsed ? 'lg:justify-center lg:px-0' : 'gap-2',
          isDashboardActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground',
        ]"
      >
        <RouterLink
          to="/"
          :title="props.isCollapsed ? 'Dashboard' : undefined"
          class="flex w-full items-center"
          :class="[props.isCollapsed ? 'justify-center' : 'gap-2 px-2']"
        >
          <AppIcon
            icon="radix-icons:home"
            class="h-4 w-4"
            :class="[isDashboardActive ? 'text-foreground' : 'text-muted-foreground']"
          />
          <span v-if="!props.isCollapsed">Dashboard</span>
          <span v-else class="sr-only">Dashboard</span>
        </RouterLink>
      </Button>

      <!-- 动态菜单组 -->
      <div class="mt-4 space-y-1">
        <div v-for="group in dynamicGroups" :key="group.fullPath">
          <!-- 有子菜单的分组 -->
          <div v-if="group.isGroup">
            <button
              type="button"
              class="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              :class="[props.isCollapsed ? 'lg:justify-center lg:px-0' : '']"
              :title="props.isCollapsed ? group.title : undefined"
              :aria-expanded="isDynamicGroupOpen(group.fullPath)"
              :aria-controls="toSafeDomId(group.fullPath)"
              @click="toggleDynamicGroup(group.fullPath)"
            >
              <AppIcon :icon="group.icon ?? DEFAULT_ICON" class="h-4 w-4" />

              <span v-if="!props.isCollapsed" class="flex-1 truncate text-left">{{
                group.title
              }}</span>
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
              class="mt-1 space-y-1"
              :class="[props.isCollapsed ? '' : 'ml-4 border-l pl-2']"
            >
              <AppMenuTree
                v-if="group.children.length > 0"
                :items="group.children"
                :parent-path="group.fullPath"
                :collapsed="props.isCollapsed"
              />
              <div v-else-if="!props.isCollapsed" class="px-2 py-1.5 text-xs text-muted-foreground">
                暂无子菜单
              </div>
            </div>
          </div>

          <!-- 无子菜单的链接 -->
          <Button
            v-else
            as-child
            variant="ghost"
            class="h-9 w-full justify-start"
            :class="[
              props.isCollapsed ? 'lg:justify-center lg:px-0' : 'gap-2',
              isActivePath(group.fullPath)
                ? 'bg-accent font-medium text-foreground'
                : 'text-muted-foreground',
            ]"
          >
            <RouterLink
              :to="group.fullPath"
              :title="props.isCollapsed ? group.title : undefined"
              class="flex w-full items-center"
              :class="[props.isCollapsed ? 'justify-center' : 'gap-2 px-2']"
            >
              <AppIcon
                :icon="group.icon ?? DEFAULT_ICON"
                class="h-4 w-4"
                :class="[
                  isActivePath(group.fullPath) ? 'text-foreground' : 'text-muted-foreground',
                ]"
              />
              <span v-if="!props.isCollapsed">{{ group.title }}</span>
              <span v-else class="sr-only">{{ group.title }}</span>
            </RouterLink>
          </Button>
        </div>
      </div>
    </nav>
  </aside>
</template>
