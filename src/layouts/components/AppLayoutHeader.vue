<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #layout-split | Time: 2025-12-29T00:00:00+08:00
Principle: Layout is composition; keep pieces small.
Taste: Header is frosted, elevated, and content-first.
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
import { useAppAccentColor } from "@/composables/useAppAccentColor"
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
const { accentKey, options: accentOptions, setAccentKey } = useAppAccentColor()

const isLoggingOut = ref(false)

// ========== Search palette ==========

const isSearchOpen = ref(false)
const searchQuery = ref("")
const searchPanelRef = ref<HTMLDivElement | null>(null)

const isUserMenuOpen = ref(false)
const userMenuButtonRef = ref<HTMLButtonElement | null>(null)
const userMenuPanelRef = ref<HTMLDivElement | null>(null)

const avatarLoadFailed = ref(false)

const displayName = computed(() => profile.value?.nickname ?? profile.value?.username ?? "用户")
const userSubline = computed(() => profile.value?.email ?? profile.value?.username ?? "")

const accentLabel = computed(
  () => accentOptions.find((option) => option.key === accentKey.value)?.label ?? "",
)

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
  const target = profilePath.value
  if (!target) {
    notify.info("未找到个人信息入口")
    closeUserMenu()
    return
  }

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
const tabMenuPanelRef = ref<HTMLDivElement | null>(null)

function closeTabMenu() {
  tabMenuOpen.value = false
  tabMenuTargetKey.value = ""
}

function openTabMenu(event: MouseEvent, tab: AppTab) {
  event.preventDefault()
  event.stopPropagation()

  const menuWidth = 240
  const menuHeight = 220
  const padding = 8

  const maxX = Math.max(padding, window.innerWidth - menuWidth - padding)
  const maxY = Math.max(padding, window.innerHeight - menuHeight - padding)

  tabMenuX.value = Math.min(Math.max(event.clientX, padding), maxX)
  tabMenuY.value = Math.min(Math.max(event.clientY, padding), maxY)
  tabMenuTargetKey.value = tab.key
  tabMenuOpen.value = true
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
    const panel = tabMenuPanelRef.value
    if (!panel?.contains(target)) closeTabMenu()
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
    class="sticky top-0 z-30 bg-card/75 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-card/65"
  >
    <header class="bg-transparent">
      <div class="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            class="rounded-full lg:hidden"
            aria-label="Open sidebar"
            @click="emit('openSidebar')"
          >
            <AppIcon icon="radix-icons:hamburger-menu" class="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            class="-ml-2 hidden rounded-full lg:inline-flex"
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

          <Separator class="hidden h-6 opacity-60 md:block" orientation="vertical" />

          <div class="min-w-0 md:hidden">
            <div class="truncate text-sm font-semibold tracking-tight">{{ pageTitle }}</div>
          </div>

          <nav
            class="hidden min-w-0 items-center gap-1 overflow-x-auto md:flex"
            aria-label="Breadcrumb"
          >
            <template
              v-for="(crumb, index) in breadcrumbs"
              :key="`${crumb.label}-${crumb.to ?? index}`"
            >
              <span v-if="index > 0" class="flex h-11 items-center text-muted-foreground/60"
                >/</span
              >

              <RouterLink
                v-if="crumb.to"
                :to="crumb.to"
                class="group inline-flex h-11 items-center rounded-full px-2 text-[13px] text-muted-foreground transition-[transform,box-shadow,color,background] hover:-translate-y-px hover:bg-accent/60 hover:text-foreground hover:shadow-sm"
              >
                <AppIcon
                  v-if="index === 0"
                  icon="radix-icons:home"
                  class="mr-1.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground"
                />
                <span class="max-w-[16rem] truncate">{{ crumb.label }}</span>
              </RouterLink>

              <span
                v-else
                class="inline-flex h-11 items-center rounded-full px-2 text-[13px] font-medium text-foreground"
              >
                <AppIcon
                  v-if="index === 0"
                  icon="radix-icons:home"
                  class="mr-1.5 h-4 w-4 text-muted-foreground"
                />
                <span class="max-w-[18rem] truncate">{{ crumb.label }}</span>
              </span>
            </template>
          </nav>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            class="group relative hidden h-11 w-72 items-center gap-2 rounded-full bg-background/60 px-4 text-[13px] text-muted-foreground ring-1 ring-foreground/5 transition-[background,box-shadow,transform] hover:-translate-y-px hover:bg-background/70 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:flex"
            aria-label="Search"
            @click="openSearchPalette"
          >
            <AppIcon icon="radix-icons:magnifying-glass" class="h-4 w-4 text-muted-foreground" />
            <span class="min-w-0 flex-1 truncate text-left">搜索页面 / 快速导航</span>
            <kbd
              class="rounded-md bg-background/60 px-1.5 py-0.5 text-[10px] text-muted-foreground ring-1 ring-foreground/10"
            >
              ⌘ K
            </kbd>
          </button>

          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-[background,box-shadow,color,transform] hover:-translate-y-px hover:bg-accent hover:text-foreground hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            :title="isFullscreen ? '退出全屏' : '进入全屏'"
            :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
            @click="toggleFullscreen"
          >
            <AppIcon
              :icon="
                isFullscreen ? 'radix-icons:exit-full-screen' : 'radix-icons:enter-full-screen'
              "
              class="h-4 w-4"
            />
          </button>

          <div class="relative">
            <button
              ref="userMenuButtonRef"
              type="button"
              class="flex h-11 items-center gap-2 rounded-full px-2 text-[13px] font-medium tracking-tight transition-[background,box-shadow,transform] hover:-translate-y-px hover:bg-accent hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label="User menu"
              aria-haspopup="menu"
              :aria-expanded="isUserMenuOpen"
              @click="toggleUserMenu"
            >
              <img
                :src="avatarSrc"
                alt="Avatar"
                class="h-9 w-9 rounded-full object-cover"
                @error="onAvatarError"
              />
              <div class="hidden min-w-0 sm:block">
                <div class="max-w-[10rem] truncate">{{ displayName }}</div>
              </div>
              <AppIcon icon="radix-icons:chevron-down" class="h-4 w-4 text-muted-foreground" />
            </button>

            <div
              v-show="isUserMenuOpen"
              ref="userMenuPanelRef"
              class="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-72 rounded-xl bg-popover/80 p-1 shadow-lg ring-1 ring-foreground/5 backdrop-blur-xl"
              role="menu"
              aria-label="User menu"
            >
              <div class="flex items-center gap-3 rounded-xl px-3 py-2">
                <img
                  :src="avatarSrc"
                  alt="Avatar"
                  class="h-10 w-10 rounded-full object-cover"
                  @error="onAvatarError"
                />
                <div class="min-w-0">
                  <div class="truncate text-[13px] font-medium">{{ displayName }}</div>
                  <div class="truncate text-[11px] text-muted-foreground">{{ userSubline }}</div>
                </div>
              </div>

              <Separator class="my-1 opacity-50" />

              <div
                class="px-2 pt-1 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground/80"
              >
                主题设置
              </div>

              <button
                type="button"
                class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] hover:bg-accent"
                role="menuitem"
                @click="toggleThemeFromMenu"
              >
                <AppIcon
                  :icon="isDark ? 'radix-icons:sun' : 'radix-icons:moon'"
                  class="h-4 w-4 text-muted-foreground"
                />
                <span>主题</span>
                <span class="ml-auto text-[11px] text-muted-foreground">
                  {{ preference === "auto" ? "自动" : isDark ? "深色" : "浅色" }}
                </span>
              </button>

              <button
                type="button"
                class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] hover:bg-accent"
                role="menuitem"
                @click="toggleTabsFromMenu"
              >
                <AppIcon icon="radix-icons:stack" class="h-4 w-4 text-muted-foreground" />
                <span>标签页</span>
                <span class="ml-auto text-[11px] text-muted-foreground">
                  {{ tabsEnabled ? "开启" : "关闭" }}
                </span>
              </button>

              <div class="px-3 pt-2 pb-2">
                <div class="flex items-center justify-between px-1">
                  <div class="text-[11px] font-semibold tracking-wide text-muted-foreground/80">
                    主题色
                  </div>
                  <div class="text-[11px] text-muted-foreground">{{ accentLabel }}</div>
                </div>

                <div class="mt-2 grid grid-cols-5 gap-2">
                  <button
                    v-for="option in accentOptions"
                    :key="option.key"
                    type="button"
                    class="relative grid h-11 w-11 place-items-center rounded-xl ring-1 ring-foreground/10 transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    :class="[option.key === accentKey ? 'ring-2 ring-ring' : '']"
                    :aria-label="`主题色：${option.label}`"
                    @click="setAccentKey(option.key)"
                  >
                    <span
                      class="h-5 w-5 rounded-full ring-1 ring-foreground/15"
                      :style="{ backgroundColor: swatchColor(option.light, option.dark) }"
                    />
                  </button>
                </div>
              </div>

              <Separator class="my-1 opacity-50" />

              <button
                type="button"
                class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] hover:bg-accent"
                role="menuitem"
                @click="openProfile"
              >
                <AppIcon icon="radix-icons:person" class="h-4 w-4 text-muted-foreground" />
                <span>修改个人信息</span>
              </button>

              <button
                type="button"
                class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] hover:bg-accent disabled:opacity-50"
                role="menuitem"
                :disabled="isLoggingOut"
                @click="logoutFromMenu"
              >
                <AppIcon icon="radix-icons:exit" class="h-4 w-4 text-muted-foreground" />
                <span>{{ isLoggingOut ? "退出中..." : "退出登录" }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <div
      v-if="tabsEnabled && openedTabs.length > 0"
      class="border-t border-foreground/5 bg-transparent"
    >
      <div class="flex h-11 items-stretch overflow-x-auto px-2 sm:px-3">
        <div
          v-for="tab in openedTabs"
          :key="tab.key"
          class="group inline-flex h-full w-24 items-center gap-2 border-r border-b-2 border-foreground/5 border-b-transparent px-2 text-[12px] leading-none font-medium transition-[background,color,border-color]"
          :class="[
            tab.key === activeTabKey
              ? 'border-b-primary/60 bg-background/60 text-foreground'
              : 'text-muted-foreground hover:border-b-primary/50 hover:bg-background/60 hover:text-foreground',
          ]"
          @contextmenu.prevent="openTabMenu($event, tab)"
        >
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-2 text-left"
            :title="tab.title"
            @click="activateTab(tab)"
          >
            <span class="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span class="block min-w-0 truncate">{{ tab.title }}</span>
          </button>

          <button
            type="button"
            class="grid h-7 w-7 place-items-center rounded-md text-muted-foreground/70 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-30"
            aria-label="Close tab"
            :disabled="tab.closable !== true"
            @click.stop="closeTabByKey(tab.key)"
          >
            <AppIcon icon="radix-icons:cross-1" class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <div
    v-show="tabMenuOpen"
    ref="tabMenuPanelRef"
    class="fixed z-[60] w-60 rounded-xl bg-popover/80 p-1 shadow-lg ring-1 ring-foreground/5 backdrop-blur-xl"
    role="menu"
    aria-label="Tab menu"
    :style="{ left: `${tabMenuX}px`, top: `${tabMenuY}px` }"
  >
    <button
      type="button"
      class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] hover:bg-accent"
      role="menuitem"
      @click="refreshByKey(tabMenuTargetKey || route.fullPath)"
    >
      <AppIcon icon="radix-icons:reload" class="h-4 w-4 text-muted-foreground" />
      <span>刷新</span>
    </button>

    <button
      type="button"
      class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] hover:bg-accent disabled:opacity-50"
      role="menuitem"
      :disabled="tabMenuTargetKey === '/'"
      @click="closeTabByKey(tabMenuTargetKey)"
    >
      <AppIcon icon="radix-icons:cross-1" class="h-4 w-4 text-muted-foreground" />
      <span>关闭</span>
    </button>

    <button
      type="button"
      class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] hover:bg-accent disabled:opacity-50"
      role="menuitem"
      :disabled="openedTabs.length <= 1"
      @click="closeOthersByKey(tabMenuTargetKey || route.fullPath)"
    >
      <AppIcon icon="radix-icons:cross-2" class="h-4 w-4 text-muted-foreground" />
      <span>关闭其他</span>
    </button>

    <button
      type="button"
      class="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] hover:bg-accent disabled:opacity-50"
      role="menuitem"
      :disabled="openedTabs.length <= 1"
      @click="closeAllTabs"
    >
      <AppIcon icon="radix-icons:trash" class="h-4 w-4 text-muted-foreground" />
      <span>关闭全部</span>
    </button>
  </div>

  <div v-show="isSearchOpen" class="fixed inset-0 z-[70]">
    <div class="absolute inset-0 bg-foreground/20 backdrop-blur-sm" />
    <div class="relative mx-auto mt-20 w-full max-w-2xl px-4">
      <div
        ref="searchPanelRef"
        class="overflow-hidden rounded-xl bg-popover/80 shadow-xl ring-1 ring-foreground/5 backdrop-blur-xl"
        role="dialog"
        aria-label="Search"
      >
        <div class="p-2">
          <div class="relative">
            <AppIcon
              icon="radix-icons:magnifying-glass"
              class="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              placeholder="搜索页面菜单，快速导航"
              class="h-11 rounded-xl border-input/40 bg-background/60 pr-4 pl-11 shadow-none"
              @keydown="onSearchKeyDown"
            />
          </div>
        </div>

        <div class="max-h-[28rem] overflow-auto p-2 pt-0">
          <div
            v-if="filteredSearchItems.length === 0"
            class="px-3 py-8 text-center text-[13px] text-muted-foreground"
          >
            无匹配结果
          </div>

          <button
            v-for="item in filteredSearchItems"
            :key="item.key"
            type="button"
            class="group flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left transition-[background,box-shadow,transform] hover:-translate-y-px hover:bg-accent hover:shadow-sm"
            @click="navigateToSearchItem(item)"
          >
            <AppIcon
              :icon="item.externalLink ? 'radix-icons:external-link' : 'radix-icons:arrow-right'"
              class="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground"
            />
            <div class="min-w-0 flex-1">
              <div class="truncate text-[13px] font-medium text-foreground">{{ item.title }}</div>
              <div class="truncate text-[11px] text-muted-foreground">{{ item.breadcrumb }}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
