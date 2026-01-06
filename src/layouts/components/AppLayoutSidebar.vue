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

import { storeToRefs } from "pinia"
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"

import { logout as apiLogout } from "@/api/auth"
import defaultAvatar from "@/assets/default.jpeg"
import AppIcon from "@/components/app-icon"
import AppMenuTree from "@/components/app-menu-tree"
import { Button } from "@/components/ui/button"
import { ThemeColorPicker } from "@/components/ui/theme-color-picker"
import { useAppColorMode } from "@/composables/useAppColorMode"
import { type ThemeColor, useThemeColor } from "@/composables/useThemeColor"
import { appConfig } from "@/config/app"
import { useTabsStore } from "@/stores/tabs"
import { useUserStore } from "@/stores/user"

const props = defineProps<{
  isOpen: boolean
  isCollapsed: boolean
  routers: RouterVO[]
}>()

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const tabsStore = useTabsStore()

const { profile } = storeToRefs(userStore)
const { enabled: tabsEnabled } = storeToRefs(tabsStore)

const { isDark, preference, toggleColorMode } = useAppColorMode()
const { themeColor } = useThemeColor()

const THEME_COLOR_LABELS: Record<ThemeColor, string> = {
  default: "Default",
  red: "Red",
  rose: "Rose",
  orange: "Orange",
  green: "Green",
  blue: "Blue",
  yellow: "Yellow",
  violet: "Violet",
}

const themeColorLabel = computed(() => THEME_COLOR_LABELS[themeColor.value] ?? themeColor.value)

const avatarLoadFailed = ref(false)
const isLoggingOut = ref(false)

const displayName = computed(() => profile.value?.nickname ?? profile.value?.username ?? "用户")
const userSubline = computed(() => profile.value?.email ?? profile.value?.username ?? "")

const avatarSrc = computed(() => {
  if (avatarLoadFailed.value) return defaultAvatar
  const value = profile.value?.avatar?.trim()
  return value || defaultAvatar
})

watch(
  () => profile.value?.avatar,
  () => {
    avatarLoadFailed.value = false
  },
)

function onAvatarError() {
  avatarLoadFailed.value = true
}

// ========== User Panel ==========

const isUserPanelOpen = ref(false)
const userButtonRef = ref<HTMLButtonElement | null>(null)
const userPanelRef = ref<HTMLDivElement | null>(null)
const userPanelX = ref(0)
const userPanelY = ref(0)

const USER_PANEL_WIDTH = 288
const USER_PANEL_HEIGHT = 332
const USER_PANEL_PADDING = 8
const USER_PANEL_OFFSET = 8

function closeUserPanel() {
  isUserPanelOpen.value = false
}

function clampPanelPosition(left: number, top: number, width: number, height: number) {
  const maxX = Math.max(USER_PANEL_PADDING, window.innerWidth - width - USER_PANEL_PADDING)
  const maxY = Math.max(USER_PANEL_PADDING, window.innerHeight - height - USER_PANEL_PADDING)

  userPanelX.value = Math.min(Math.max(left, USER_PANEL_PADDING), maxX)
  userPanelY.value = Math.min(Math.max(top, USER_PANEL_PADDING), maxY)
}

async function openUserPanel() {
  const button = userButtonRef.value
  if (!button) return

  const rect = button.getBoundingClientRect()

  const left = rect.right + USER_PANEL_OFFSET
  const top = rect.bottom - USER_PANEL_HEIGHT

  clampPanelPosition(left, top, USER_PANEL_WIDTH, USER_PANEL_HEIGHT)
  isUserPanelOpen.value = true

  await nextTick()
  const panel = userPanelRef.value
  if (!panel) return

  const measuredWidth = panel.offsetWidth || USER_PANEL_WIDTH
  const measuredHeight = panel.offsetHeight || USER_PANEL_HEIGHT
  clampPanelPosition(left, rect.bottom - measuredHeight, measuredWidth, measuredHeight)
}

function toggleUserPanel() {
  if (isUserPanelOpen.value) {
    closeUserPanel()
    return
  }
  void openUserPanel()
}

function openProfile() {
  closeUserPanel()
  void router.push("/user/profile")
}

function openAccount() {
  closeUserPanel()
  void router.push("/user/account")
}

function toggleThemeFromPanel() {
  toggleColorMode()
  closeUserPanel()
}

function toggleTabsFromPanel() {
  tabsStore.setEnabled(!tabsEnabled.value)
  closeUserPanel()
}

async function logout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  try {
    await apiLogout()
  } catch (error) {
    console.warn("[Logout] API call failed:", error)
  } finally {
    userStore.logout()
    isLoggingOut.value = false
    router.replace({ name: "login" })
  }
}

async function logoutFromPanel() {
  closeUserPanel()
  await logout()
}

function onDocumentPointerDown(event: PointerEvent) {
  if (!isUserPanelOpen.value) return

  const target = event.target as Node | null
  if (!target) return

  const button = userButtonRef.value
  const panel = userPanelRef.value
  if (!button?.contains(target) && !panel?.contains(target)) closeUserPanel()
}

function onDocumentKeyDown(event: KeyboardEvent) {
  if (event.key !== "Escape") return
  closeUserPanel()
}

watch(
  () => route.fullPath,
  () => {
    closeUserPanel()
  },
)

watch(
  () => props.isOpen,
  (open) => {
    if (!open) closeUserPanel()
  },
)

watch(
  () => props.isCollapsed,
  () => {
    closeUserPanel()
  },
)

onMounted(() => {
  document.addEventListener("pointerdown", onDocumentPointerDown, { capture: true })
  document.addEventListener("keydown", onDocumentKeyDown)
})

onUnmounted(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown, { capture: true })
  document.removeEventListener("keydown", onDocumentKeyDown)
})

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
      class="flex h-14 items-center gap-2 px-4"
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
      <RouterLink
        to="/"
        :title="props.isCollapsed ? 'Dashboard' : undefined"
        class="flex h-9 w-full items-center rounded-md text-sm transition-colors hover:bg-accent hover:text-foreground"
        :class="[
          props.isCollapsed ? 'lg:justify-center lg:px-0' : 'gap-2 px-2',
          isDashboardActive ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground',
        ]"
      >
        <AppIcon
          icon="radix-icons:home"
          class="h-4 w-4"
          :class="[isDashboardActive ? 'text-primary' : 'text-muted-foreground']"
        />
        <span v-if="!props.isCollapsed">Dashboard</span>
        <span v-else class="sr-only">Dashboard</span>
      </RouterLink>

      <!-- 动态菜单组 -->
      <div class="mt-4 space-y-1">
        <div v-for="group in dynamicGroups" :key="group.fullPath">
          <!-- 有子菜单的分组 -->
          <div v-if="group.isGroup">
            <button
              type="button"
              class="flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              :class="[
                props.isCollapsed ? 'lg:justify-center lg:px-0' : '',
                isActivePath(group.fullPath) ? 'bg-accent font-medium text-foreground' : '',
              ]"
              :title="props.isCollapsed ? group.title : undefined"
              :aria-expanded="isDynamicGroupOpen(group.fullPath)"
              :aria-controls="toSafeDomId(group.fullPath)"
              @click="toggleDynamicGroup(group.fullPath)"
            >
              <AppIcon
                :icon="group.icon ?? DEFAULT_ICON"
                class="h-4 w-4"
                :class="[isActivePath(group.fullPath) ? 'text-primary' : '']"
              />

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
                :class="[isActivePath(group.fullPath) ? 'text-primary' : 'text-muted-foreground']"
              />
              <span v-if="!props.isCollapsed">{{ group.title }}</span>
              <span v-else class="sr-only">{{ group.title }}</span>
            </RouterLink>
          </Button>
        </div>
      </div>
    </nav>

    <!-- 用户区域（左侧菜单底部） -->
    <div class="p-2" :class="[props.isCollapsed ? 'lg:px-2' : '']">
      <button
        ref="userButtonRef"
        type="button"
        class="flex h-12 w-full items-center justify-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-accent hover:text-foreground"
        :class="[
          props.isCollapsed ? 'lg:justify-center lg:px-0' : '',
          isUserPanelOpen ? 'bg-accent text-foreground' : 'text-foreground',
        ]"
        aria-label="User panel"
        aria-haspopup="menu"
        :aria-expanded="isUserPanelOpen"
        @click="toggleUserPanel"
      >
        <img
          :src="avatarSrc"
          alt="Avatar"
          class="h-8 w-8 rounded-full object-cover"
          @error="onAvatarError"
        />

        <div v-if="!props.isCollapsed" class="max-w-[160px] min-w-0 text-left">
          <div class="truncate text-sm leading-tight font-medium">{{ displayName }}</div>
          <div class="truncate text-xs leading-tight text-muted-foreground">{{ userSubline }}</div>
        </div>
        <span v-else class="sr-only">{{ displayName }} {{ userSubline }}</span>

        <AppIcon
          v-if="!props.isCollapsed"
          icon="radix-icons:chevron-right"
          class="h-4 w-4 text-muted-foreground transition-transform"
          :class="[isUserPanelOpen ? 'rotate-90' : '']"
        />
      </button>
    </div>
  </aside>

  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      leave-active-class="transition duration-100 ease-in"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-show="isUserPanelOpen"
        ref="userPanelRef"
        class="liquid-glass fixed z-[60] w-72 origin-top-left space-y-1 rounded-xl p-2 text-popover-foreground"
        role="menu"
        :style="{ left: `${userPanelX}px`, top: `${userPanelY}px` }"
      >
        <div class="flex items-center gap-3 px-2 py-2">
          <img
            :src="avatarSrc"
            alt="Avatar"
            class="h-9 w-9 rounded-full object-cover"
            @error="onAvatarError"
          />
          <div class="min-w-0">
            <div class="truncate text-sm font-medium">{{ displayName }}</div>
            <div class="truncate text-xs text-muted-foreground">{{ userSubline }}</div>
          </div>
        </div>

        <button
          type="button"
          class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent"
          role="menuitem"
          @click="toggleThemeFromPanel"
        >
          <AppIcon
            :icon="isDark ? 'radix-icons:sun' : 'radix-icons:moon'"
            class="h-4 w-4 text-muted-foreground"
          />
          <span>主题</span>
          <span class="ml-auto text-xs text-muted-foreground">
            {{ preference === "auto" ? "自动" : isDark ? "深色" : "浅色" }}
          </span>
        </button>

        <!-- 主题色选择 -->
        <div class="px-2 pt-2 pb-1">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-muted-foreground">主题色</span>
            <span class="text-xs text-muted-foreground">{{ themeColorLabel }}</span>
          </div>
          <div class="mt-2">
            <ThemeColorPicker />
          </div>
        </div>

        <button
          type="button"
          class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent"
          role="menuitem"
          @click="toggleTabsFromPanel"
        >
          <AppIcon icon="radix-icons:stack" class="h-4 w-4 text-muted-foreground" />
          <span>标签页</span>
          <span class="ml-auto text-xs text-muted-foreground">{{
            tabsEnabled ? "开启" : "关闭"
          }}</span>
        </button>

        <button
          type="button"
          class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent"
          role="menuitem"
          @click="openProfile"
        >
          <AppIcon icon="radix-icons:person" class="h-4 w-4 text-muted-foreground" />
          <span>个人信息</span>
        </button>

        <button
          type="button"
          class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent"
          role="menuitem"
          @click="openAccount"
        >
          <AppIcon icon="radix-icons:gear" class="h-4 w-4 text-muted-foreground" />
          <span>账号与安全</span>
        </button>

        <button
          type="button"
          class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent disabled:opacity-50"
          role="menuitem"
          :disabled="isLoggingOut"
          @click="logoutFromPanel"
        >
          <AppIcon icon="radix-icons:exit" class="h-4 w-4 text-muted-foreground" />
          <span>{{ isLoggingOut ? "退出中..." : "退出登录" }}</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
