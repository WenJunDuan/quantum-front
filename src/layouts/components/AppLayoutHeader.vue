<!--
  Header 组件 - shadcn-vue 官方规范
  
  修改点：
  - Header 背景: 简化毛玻璃效果
  - 搜索框: h-11 → h-9, 移除 rounded-full
  - 工具按钮: h-11 w-11 → h-9 w-9
  - 下拉面板: 简化样式，减小圆角
  - 菜单项高度: h-11 → h-8
  - 字体: 统一使用 text-sm, text-xs
  - 选项卡: 简化为标准样式
-->

<script setup lang="ts">
import type { AppTab } from "@/stores/tabs"
import type { RouteLocationMatched } from "vue-router"

import { storeToRefs } from "pinia"
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { RouterLink, useRoute, useRouter } from "vue-router"

import { logout as apiLogout } from "@/api/auth"
import defaultAvatar from "@/assets/default.jpeg"
import AppIcon from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { type AccentColorKey, useAppAccentColor } from "@/composables/useAppAccentColor"
import { useAppColorMode } from "@/composables/useAppColorMode"
import { appConfig } from "@/config/app"
import { useNotifyStore } from "@/stores/notify"
import { useTabsStore } from "@/stores/tabs"
import { useUserStore } from "@/stores/user"

const props = defineProps<{
  isSidebarCollapsed: boolean
}>()

const emit = defineEmits<{
  openSidebar: []
  toggleSidebarCollapsed: []
}>()

const route = useRoute()
const router = useRouter()
const notify = useNotifyStore()
const userStore = useUserStore()
const tabsStore = useTabsStore()

const { profile, routers } = storeToRefs(userStore)
const { tabs: openedTabs, activeKey: activeTabKey, enabled: tabsEnabled } = storeToRefs(tabsStore)

const { isDark, preference, toggleColorMode } = useAppColorMode()
const {
  accentKey,
  customColor,
  options: accentOptions,
  setAccentKey,
  setCustomColor,
} = useAppAccentColor()

const isLoggingOut = ref(false)

// ========== Search palette ==========

const CUSTOM_SWATCH_GRADIENT =
  "conic-gradient(from 180deg, #FF3B30, #FF9500, #FFCC00, #34C759, #32ADE6, #5856D6, #AF52DE, #FF2D55, #FF3B30)"

const isSearchOpen = ref(false)
const searchQuery = ref("")
const searchPanelRef = ref<HTMLDivElement | null>(null)

const isUserMenuOpen = ref(false)
const userMenuButtonRef = ref<HTMLButtonElement | null>(null)
const userMenuPanelRef = ref<HTMLDivElement | null>(null)

const avatarLoadFailed = ref(false)

const displayName = computed(() => profile.value?.nickname ?? profile.value?.username ?? "用户")
const userSubline = computed(() => profile.value?.email ?? profile.value?.username ?? "")

const accentLabel = computed(() => {
  if (accentKey.value === "custom") return customColor.value
  return accentOptions.find((option) => option.key === accentKey.value)?.label ?? ""
})

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

function onAccentOptionClick(key: AccentColorKey, event: MouseEvent) {
  if (key !== "custom") {
    setAccentKey(key)
    return
  }

  setAccentKey("custom")

  const button = event.currentTarget as HTMLElement | null
  const input = button?.querySelector("input[type='color']") as HTMLInputElement | null
  input?.click()
}

function onCustomAccentInput(event: Event) {
  const input = event.target as HTMLInputElement | null
  const value = input?.value
  if (typeof value !== "string") return

  setAccentKey("custom")
  setCustomColor(value)
}

const pageTitle = computed(() => {
  if (typeof route.meta.title === "string" && route.meta.title.trim()) return route.meta.title
  return appConfig.title
})

interface BreadcrumbItem {
  label: string
  to?: string
}

function resolveBreadcrumbTo(record: RouteLocationMatched): string | null {
  if (!record.name) return null
  return router.resolve({ name: record.name, params: route.params, query: route.query }).fullPath
}

const breadcrumbs = computed<BreadcrumbItem[]>(() => {
  const items: BreadcrumbItem[] = []

  const matched = route.matched
    .map((record) => {
      const title = typeof record.meta?.title === "string" ? record.meta.title.trim() : ""
      if (!title) return null

      return {
        label: title,
        to: resolveBreadcrumbTo(record) ?? undefined,
      } satisfies BreadcrumbItem
    })
    .filter(Boolean)
    .filter((item) => item.label !== "首页" && item.to !== "/")

  if (route.path !== "/") items.push({ label: "首页", to: "/" })
  items.push(...matched)

  if (items.length === 0) return [{ label: "首页" }]
  return items.map((item, index) => (index === items.length - 1 ? { label: item.label } : item))
})

function toggleUserMenu() {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

function closeUserMenu() {
  isUserMenuOpen.value = false
}

interface SearchItem {
  key: string
  title: string
  breadcrumb: string
  fullPath: string
  externalLink?: string
}

function normalizeText(input: string): string {
  return input.trim().toLowerCase()
}

function menuTitle(item: MenuLike): string {
  const title = typeof item?.meta?.title === "string" ? item.meta.title.trim() : ""
  if (title) return title

  const name = typeof item?.name === "string" ? item.name.trim() : ""
  if (name) return name

  const path = typeof item?.path === "string" ? item.path.trim() : ""
  if (path) return path

  return "未命名菜单"
}

function buildSearchItems(
  items: unknown,
  parentPath = "",
  parentTitles: string[] = [],
): SearchItem[] {
  if (!Array.isArray(items)) return []

  const output: SearchItem[] = []

  for (const raw of items) {
    const item = raw as MenuLike
    if (item?.hidden === true) continue

    const path = typeof item?.path === "string" ? item.path.trim() : ""
    const fullPath = joinMenuPath(parentPath, path)
    const title = menuTitle(item)
    const titles = [...parentTitles, title].filter(Boolean)

    const link = typeof item?.meta?.link === "string" ? item.meta.link.trim() : ""
    const children = Array.isArray(item?.children) ? item.children : []

    if (children.length > 0) {
      output.push(...buildSearchItems(children, fullPath, titles))
      continue
    }

    if (link) {
      output.push({
        key: `link:${link}`,
        title,
        breadcrumb: titles.join(" / "),
        fullPath,
        externalLink: link,
      })
      continue
    }

    output.push({
      key: `path:${fullPath || "/"}`,
      title,
      breadcrumb: titles.join(" / "),
      fullPath: fullPath || "/",
    })
  }

  return output
}

const searchItems = computed<SearchItem[]>(() => {
  const items = buildSearchItems(routers.value)
  const home: SearchItem = { key: "path:/", title: "首页", breadcrumb: "首页", fullPath: "/" }
  return [home, ...items.filter((item) => item.fullPath !== "/")]
})

const filteredSearchItems = computed<SearchItem[]>(() => {
  const query = normalizeText(searchQuery.value)
  const items = searchItems.value

  if (!query) return items.slice(0, 24)

  return items
    .filter((item) => {
      const haystack = normalizeText(`${item.title} ${item.breadcrumb}`)
      return haystack.includes(query)
    })
    .slice(0, 24)
})

function closeSearchPalette() {
  isSearchOpen.value = false
}

async function openSearchPalette() {
  isSearchOpen.value = true
  closeUserMenu()
  closeTabMenu()

  await nextTick()
  const input = searchPanelRef.value?.querySelector("input") as HTMLInputElement | null
  input?.focus()
  input?.select()
}

function onSearchKeyDown(event: KeyboardEvent) {
  if (event.key !== "Enter") return
  const first = filteredSearchItems.value[0]
  if (!first) return
  void navigateToSearchItem(first)
}

async function navigateToSearchItem(item: SearchItem) {
  closeSearchPalette()

  if (item.externalLink) {
    window.open(item.externalLink, "_blank", "noopener,noreferrer")
    return
  }

  if (item.fullPath && item.fullPath !== route.fullPath) await router.push(item.fullPath)
}

interface MenuLike {
  path?: unknown
  hidden?: unknown
  name?: unknown
  meta?: { title?: unknown; link?: unknown } | null
  children?: unknown
}

function normalizePathSegment(path: string) {
  const trimmed = path.trim()
  if (!trimmed || trimmed === "/") return ""
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "")
}

function joinMenuPath(parent: string, child: string) {
  const childTrimmed = child.trim()
  if (!childTrimmed) return parent || "/"
  if (childTrimmed.startsWith("/")) return childTrimmed

  const base = parent.replace(/\/+$/, "")
  const seg = normalizePathSegment(childTrimmed)
  return base ? `${base}/${seg}` : `/${seg}`
}

function findProfilePath(items: unknown, parentPath = ""): string | null {
  if (!Array.isArray(items)) return null

  for (const raw of items) {
    const item = raw as MenuLike
    if (item?.hidden === true) continue

    const title = typeof item?.meta?.title === "string" ? item.meta.title.trim() : ""
    const name = typeof item?.name === "string" ? item.name.trim() : ""
    const path = typeof item?.path === "string" ? item.path.trim() : ""

    const fullPath = joinMenuPath(parentPath, path)
    const hit =
      /个人信息|个人资料|个人中心|我的信息|账号信息|profile|account/i.test(title) ||
      /个人信息|个人资料|个人中心|我的信息|账号信息|profile|account/i.test(name) ||
      /(profile|account|personal|me|mine|center|userinfo|user-info)/i.test(fullPath)
    if (hit && fullPath && fullPath !== "/") return fullPath

    const children = item?.children
    const childHit = findProfilePath(children, fullPath)
    if (childHit) return childHit
  }

  return null
}

const profilePath = computed(() => findProfilePath(routers.value))

function openProfile() {
  const target = profilePath.value || "/user/profile"
  closeUserMenu()
  void router.push(target)
}

function toggleThemeFromMenu() {
  toggleColorMode()
  closeUserMenu()
}

function toggleTabsFromMenu() {
  tabsStore.setEnabled(!tabsEnabled.value)
  closeUserMenu()
}

function swatchColor(light: string, dark: string) {
  return isDark.value ? dark : light
}

async function logoutFromMenu() {
  closeUserMenu()
  await logout()
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

// ========== Fullscreen ==========

const isFullscreen = ref(false)

function syncFullscreenState() {
  isFullscreen.value = Boolean(document.fullscreenElement)
}

async function toggleFullscreen() {
  if (!document.fullscreenEnabled) {
    notify.info("当前浏览器不支持全屏")
    return
  }

  try {
    await (document.fullscreenElement
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen())
  } catch (error) {
    console.warn("[Fullscreen] Toggle failed:", error)
  } finally {
    syncFullscreenState()
  }
}

// ========== Tabs ==========

const tabMenuOpen = ref(false)
const tabMenuX = ref(0)
const tabMenuY = ref(0)
const tabMenuTargetKey = ref<string>("")
const tabMenuPinned = ref(false)
const tabActionsButtonRef = ref<HTMLButtonElement | null>(null)
const tabMenuPanelRef = ref<HTMLDivElement | null>(null)
let tabMenuCloseTimer: number | null = null

const TAB_MENU_WIDTH = 160
const TAB_MENU_HEIGHT = 160
const TAB_MENU_PADDING = 8
const TAB_MENU_OFFSET = 4

function clearTabMenuCloseTimer() {
  if (tabMenuCloseTimer === null) return
  globalThis.clearTimeout(tabMenuCloseTimer)
  tabMenuCloseTimer = null
}

function scheduleCloseTabMenu(delay = 180) {
  if (tabMenuPinned.value) return
  clearTabMenuCloseTimer()
  tabMenuCloseTimer = globalThis.setTimeout(() => {
    closeTabMenu()
  }, delay)
}

function closeTabMenu() {
  clearTabMenuCloseTimer()
  tabMenuOpen.value = false
  tabMenuPinned.value = false
  tabMenuTargetKey.value = ""
}

function openTabMenuAt(left: number, top: number, tab: AppTab) {
  clearTabMenuCloseTimer()

  const maxX = Math.max(TAB_MENU_PADDING, window.innerWidth - TAB_MENU_WIDTH - TAB_MENU_PADDING)
  const maxY = Math.max(TAB_MENU_PADDING, window.innerHeight - TAB_MENU_HEIGHT - TAB_MENU_PADDING)

  tabMenuX.value = Math.min(Math.max(left, TAB_MENU_PADDING), maxX)
  tabMenuY.value = Math.min(Math.max(top, TAB_MENU_PADDING), maxY)
  tabMenuTargetKey.value = tab.key
  tabMenuOpen.value = true
}

function openTabMenu(event: MouseEvent, tab: AppTab) {
  event.preventDefault()
  event.stopPropagation()
  openTabMenuAt(event.clientX, event.clientY, tab)
}

function getTabMenuTarget(): AppTab | null {
  const active = openedTabs.value.find((tab) => tab.key === activeTabKey.value)
  if (active) return active
  return openedTabs.value.at(-1) ?? null
}

function openTabMenuFromContext(event: MouseEvent, tab: AppTab) {
  tabMenuPinned.value = true
  openTabMenu(event, tab)
}

function openActiveTabMenu(event: MouseEvent, pin = false) {
  const tab = getTabMenuTarget()
  if (!tab) return
  tabMenuPinned.value = pin

  const button = tabActionsButtonRef.value
  if (button) {
    const rect = button.getBoundingClientRect()
    openTabMenuAt(rect.right - TAB_MENU_WIDTH, rect.bottom + TAB_MENU_OFFSET, tab)
    return
  }

  openTabMenu(event, tab)
}

function toggleTabActionsMenu(event: MouseEvent) {
  if (tabMenuOpen.value) {
    closeTabMenu()
    return
  }
  openActiveTabMenu(event, true)
}

function onTabActionsPointerEnter(event: PointerEvent) {
  if (tabMenuOpen.value && tabMenuPinned.value) return
  openActiveTabMenu(event, false)
}

function onTabActionsPointerLeave() {
  scheduleCloseTabMenu()
}

function activateTab(tab: AppTab) {
  tabsStore.activate(tab.key)
  closeTabMenu()
  if (tab.fullPath !== route.fullPath) void router.push(tab.fullPath)
}

function closeTabByKey(tabKey: string) {
  const next = tabsStore.close(tabKey)
  closeTabMenu()
  if (next && next !== route.fullPath) void router.push(next)
}

function closeOthersByKey(tabKey: string) {
  const next = tabsStore.closeOthers(tabKey)
  closeTabMenu()
  if (next && next !== route.fullPath) void router.push(next)
}

function refreshByKey(tabKey: string) {
  tabsStore.refresh(tabKey)
  closeTabMenu()
}

function closeAllTabs() {
  const next = tabsStore.closeAll()
  closeTabMenu()
  if (next && next !== route.fullPath) void router.push(next)
}

function onDocumentPointerDown(event: PointerEvent) {
  const target = event.target as Node | null
  if (!target) return

  if (isUserMenuOpen.value) {
    const button = userMenuButtonRef.value
    const panel = userMenuPanelRef.value
    if (!button?.contains(target) && !panel?.contains(target)) closeUserMenu()
  }

  if (tabMenuOpen.value) {
    const button = tabActionsButtonRef.value
    const panel = tabMenuPanelRef.value
    if (!button?.contains(target) && !panel?.contains(target)) closeTabMenu()
  }

  if (isSearchOpen.value) {
    const panel = searchPanelRef.value
    if (!panel?.contains(target)) closeSearchPalette()
  }
}

function onDocumentKeyDown(event: KeyboardEvent) {
  const target = event.target

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    const el = target as HTMLElement | null
    const tag = el?.tagName?.toLowerCase()
    const isEditable =
      tag === "input" || tag === "textarea" || tag === "select" || (el?.isContentEditable ?? false)

    if (!isEditable) {
      event.preventDefault()
      void openSearchPalette()
      return
    }
  }

  if (event.key !== "Escape") return
  closeUserMenu()
  closeTabMenu()
  closeSearchPalette()
}

watch(
  () => route.fullPath,
  () => {
    tabsStore.openFromRoute(route)
    closeUserMenu()
    closeTabMenu()
    closeSearchPalette()
  },
)

onMounted(() => {
  tabsStore.openFromRoute(route)
  syncFullscreenState()

  document.addEventListener("pointerdown", onDocumentPointerDown, { capture: true })
  document.addEventListener("keydown", onDocumentKeyDown)
  document.addEventListener("fullscreenchange", syncFullscreenState)
})

onUnmounted(() => {
  document.removeEventListener("pointerdown", onDocumentPointerDown, { capture: true })
  document.removeEventListener("keydown", onDocumentKeyDown)
  document.removeEventListener("fullscreenchange", syncFullscreenState)
})
</script>

<template>
  <div
    class="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
  >
    <header>
      <div class="flex h-14 items-center justify-between gap-4 px-4 lg:px-6">
        <!-- 左侧：菜单按钮 + 面包屑 -->
        <div class="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            class="lg:hidden"
            aria-label="Open sidebar"
            @click="emit('openSidebar')"
          >
            <AppIcon icon="radix-icons:hamburger-menu" class="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="hidden lg:inline-flex"
            :aria-label="props.isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
            @click="emit('toggleSidebarCollapsed')"
          >
            <AppIcon
              :icon="
                props.isSidebarCollapsed
                  ? 'radix-icons:double-arrow-right'
                  : 'radix-icons:double-arrow-left'
              "
              class="h-4 w-4"
            />
          </Button>

          <Separator class="hidden h-6 md:block" orientation="vertical" />

          <!-- 移动端标题 -->
          <div class="min-w-0 md:hidden">
            <div class="truncate text-sm font-medium">{{ pageTitle }}</div>
          </div>

          <!-- 桌面端面包屑 -->
          <nav class="hidden min-w-0 items-center gap-1 md:flex" aria-label="Breadcrumb">
            <template
              v-for="(crumb, index) in breadcrumbs"
              :key="`${crumb.label}-${crumb.to ?? index}`"
            >
              <span v-if="index > 0" class="text-muted-foreground">/</span>

              <RouterLink
                v-if="crumb.to"
                :to="crumb.to"
                class="rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <span class="max-w-[12rem] truncate">{{ crumb.label }}</span>
              </RouterLink>

              <span v-else class="px-2 py-1 text-sm font-medium text-foreground">
                <span class="max-w-[14rem] truncate">{{ crumb.label }}</span>
              </span>
            </template>
          </nav>
        </div>

        <!-- 右侧：搜索 + 工具栏 -->
        <div class="flex items-center gap-2">
          <!-- 搜索按钮 -->
          <button
            type="button"
            class="hidden h-9 w-64 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent md:flex"
            aria-label="Search"
            @click="openSearchPalette"
          >
            <AppIcon icon="radix-icons:magnifying-glass" class="h-4 w-4" />
            <span class="flex-1 truncate text-left">搜索...</span>
            <kbd class="rounded border bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
          </button>

          <!-- 全屏按钮 -->
          <Button
            variant="ghost"
            size="icon"
            :title="isFullscreen ? '退出全屏' : '进入全屏'"
            @click="toggleFullscreen"
          >
            <AppIcon
              :icon="
                isFullscreen ? 'radix-icons:exit-full-screen' : 'radix-icons:enter-full-screen'
              "
              class="h-4 w-4"
            />
          </Button>

          <!-- 用户菜单 -->
          <div class="relative">
            <button
              ref="userMenuButtonRef"
              type="button"
              class="flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors hover:bg-accent"
              aria-label="User menu"
              aria-haspopup="menu"
              :aria-expanded="isUserMenuOpen"
              @click="toggleUserMenu"
            >
              <img
                :src="avatarSrc"
                alt="Avatar"
                class="h-7 w-7 rounded-full object-cover"
                @error="onAvatarError"
              />
              <span class="hidden max-w-[8rem] truncate sm:block">{{ displayName }}</span>
              <AppIcon icon="radix-icons:chevron-down" class="h-4 w-4 text-muted-foreground" />
            </button>

            <!-- 用户下拉面板 -->
            <Transition
              enter-active-class="transition duration-150 ease-out"
              leave-active-class="transition duration-100 ease-in"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-show="isUserMenuOpen"
                ref="userMenuPanelRef"
                class="absolute top-[calc(100%+0.25rem)] right-0 z-50 w-56 origin-top-right rounded-md border bg-popover p-1 shadow-md"
                role="menu"
              >
                <!-- 用户信息 -->
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

                <Separator class="my-1" />

                <!-- 主题设置 -->
                <div class="px-2 py-1 text-xs font-medium text-muted-foreground">主题设置</div>

                <button
                  type="button"
                  class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent"
                  role="menuitem"
                  @click="toggleThemeFromMenu"
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

                <button
                  type="button"
                  class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent"
                  role="menuitem"
                  @click="toggleTabsFromMenu"
                >
                  <AppIcon icon="radix-icons:stack" class="h-4 w-4 text-muted-foreground" />
                  <span>标签页</span>
                  <span class="ml-auto text-xs text-muted-foreground">{{
                    tabsEnabled ? "开启" : "关闭"
                  }}</span>
                </button>

                <!-- 主题色选择 -->
                <div class="px-2 pt-2 pb-1">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-medium text-muted-foreground">主题色</span>
                    <span class="text-xs text-muted-foreground">{{ accentLabel }}</span>
                  </div>
                  <div class="mt-2 grid grid-cols-5 gap-1.5">
                    <button
                      v-for="option in accentOptions"
                      :key="option.key"
                      type="button"
                      class="relative grid h-8 w-8 place-items-center rounded-md ring-1 ring-border transition-colors hover:ring-2 hover:ring-ring"
                      :class="[option.key === accentKey ? 'ring-2 ring-ring' : '']"
                      :aria-label="
                        option.key === 'custom' ? '自定义主题色' : `主题色：${option.label}`
                      "
                      @click="onAccentOptionClick(option.key, $event)"
                    >
                      <input
                        v-if="option.key === 'custom'"
                        type="color"
                        class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        :value="customColor"
                        aria-label="自定义主题色"
                        @click.stop="setAccentKey('custom')"
                        @input="onCustomAccentInput"
                      />
                      <span
                        class="h-4 w-4 rounded-full ring-1 ring-border"
                        :style="
                          option.key === 'custom'
                            ? { backgroundImage: CUSTOM_SWATCH_GRADIENT }
                            : { backgroundColor: swatchColor(option.light, option.dark) }
                        "
                      />
                    </button>
                  </div>
                </div>

                <Separator class="my-1" />

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
                  class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent disabled:opacity-50"
                  role="menuitem"
                  :disabled="isLoggingOut"
                  @click="logoutFromMenu"
                >
                  <AppIcon icon="radix-icons:exit" class="h-4 w-4 text-muted-foreground" />
                  <span>{{ isLoggingOut ? "退出中..." : "退出登录" }}</span>
                </button>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </header>

    <!-- 选项卡栏 -->
    <div v-if="tabsEnabled && openedTabs.length > 0" class="border-t bg-muted/40">
      <div class="flex h-10 items-center gap-1 px-2">
        <!-- 选项卡列表 -->
        <div class="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          <button
            v-for="tab in openedTabs"
            :key="tab.key"
            type="button"
            class="group inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors"
            :class="[
              tab.key === activeTabKey
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
            ]"
            :title="tab.title"
            @click="activateTab(tab)"
            @contextmenu.prevent="openTabMenuFromContext($event, tab)"
          >
            <AppIcon
              v-if="tab.key === '/'"
              icon="radix-icons:home"
              class="h-3.5 w-3.5"
              :class="[tab.key === activeTabKey ? 'text-foreground' : 'text-muted-foreground']"
            />
            <span class="max-w-[8rem] truncate">{{ tab.title }}</span>

            <span
              class="grid h-4 w-4 place-items-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent hover:text-foreground"
              :class="[
                tab.key === activeTabKey ? 'opacity-100' : '',
                openedTabs.length <= 1 || tab.closable !== true
                  ? 'pointer-events-none opacity-0'
                  : '',
              ]"
              title="关闭标签页"
              @click.stop="openedTabs.length > 1 && tab.closable === true && closeTabByKey(tab.key)"
            >
              <AppIcon icon="radix-icons:cross-1" class="h-3 w-3" />
            </span>
          </button>
        </div>

        <!-- 选项卡操作按钮 -->
        <Button
          ref="tabActionsButtonRef"
          variant="ghost"
          size="icon"
          class="h-8 w-8 shrink-0"
          :class="[tabMenuOpen ? 'bg-accent' : '']"
          aria-label="Tab actions"
          @click="toggleTabActionsMenu($event)"
          @pointerenter="onTabActionsPointerEnter($event)"
          @pointerleave="onTabActionsPointerLeave"
        >
          <AppIcon icon="radix-icons:dots-horizontal" class="h-4 w-4" />
        </Button>
      </div>
    </div>
  </div>

  <!-- 选项卡右键菜单 -->
  <Transition
    enter-active-class="transition duration-150 ease-out"
    leave-active-class="transition duration-100 ease-in"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div
      v-show="tabMenuOpen"
      ref="tabMenuPanelRef"
      class="fixed z-[60] w-40 origin-top-left rounded-md border bg-popover p-1 shadow-md"
      role="menu"
      :style="{ left: `${tabMenuX}px`, top: `${tabMenuY}px` }"
      @pointerenter="clearTabMenuCloseTimer"
      @pointerleave="onTabActionsPointerLeave"
    >
      <button
        type="button"
        class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent"
        role="menuitem"
        @click="refreshByKey(tabMenuTargetKey || route.fullPath)"
      >
        <AppIcon icon="radix-icons:reload" class="h-4 w-4 text-muted-foreground" />
        <span>重新加载</span>
      </button>

      <button
        type="button"
        class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent disabled:opacity-50"
        role="menuitem"
        :disabled="openedTabs.length <= 1"
        @click="closeTabByKey(tabMenuTargetKey)"
      >
        <AppIcon icon="radix-icons:cross-1" class="h-4 w-4 text-muted-foreground" />
        <span>关闭当前</span>
      </button>

      <button
        type="button"
        class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent disabled:opacity-50"
        role="menuitem"
        :disabled="openedTabs.length <= 1"
        @click="closeOthersByKey(tabMenuTargetKey || route.fullPath)"
      >
        <AppIcon icon="radix-icons:cross-2" class="h-4 w-4 text-muted-foreground" />
        <span>关闭其他</span>
      </button>

      <button
        type="button"
        class="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-sm hover:bg-accent disabled:opacity-50"
        role="menuitem"
        :disabled="openedTabs.length <= 1"
        @click="closeAllTabs"
      >
        <AppIcon icon="radix-icons:trash" class="h-4 w-4 text-muted-foreground" />
        <span>关闭全部</span>
      </button>
    </div>
  </Transition>

  <!-- 搜索面板 -->
  <Transition
    enter-active-class="transition duration-150 ease-out"
    leave-active-class="transition duration-100 ease-in"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div v-show="isSearchOpen" class="fixed inset-0 z-[70]">
      <div class="absolute inset-0 bg-black/50" @click="closeSearchPalette" />
      <div class="relative mx-auto mt-20 w-full max-w-lg px-4">
        <Transition
          enter-active-class="transition duration-150 ease-out"
          leave-active-class="transition duration-100 ease-in"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-show="isSearchOpen"
            ref="searchPanelRef"
            class="overflow-hidden rounded-lg border bg-popover shadow-lg"
            role="dialog"
            aria-label="Search"
          >
            <div class="border-b p-3">
              <div class="relative">
                <AppIcon
                  icon="radix-icons:magnifying-glass"
                  class="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  v-model="searchQuery"
                  placeholder="搜索页面..."
                  class="pl-10"
                  @keydown="onSearchKeyDown"
                />
              </div>
            </div>

            <div class="max-h-80 overflow-auto p-2">
              <div
                v-if="filteredSearchItems.length === 0"
                class="px-3 py-6 text-center text-sm text-muted-foreground"
              >
                无匹配结果
              </div>

              <button
                v-for="item in filteredSearchItems"
                :key="item.key"
                type="button"
                class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                @click="navigateToSearchItem(item)"
              >
                <AppIcon
                  :icon="
                    item.externalLink ? 'radix-icons:external-link' : 'radix-icons:arrow-right'
                  "
                  class="h-4 w-4 text-muted-foreground"
                />
                <div class="min-w-0 flex-1">
                  <div class="truncate font-medium">{{ item.title }}</div>
                  <div class="truncate text-xs text-muted-foreground">{{ item.breadcrumb }}</div>
                </div>
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </Transition>
</template>
