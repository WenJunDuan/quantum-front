import type { RouteLocationNormalizedLoaded } from "vue-router"

import { defineStore } from "pinia"
import { computed, ref } from "vue"

import { appConfig } from "@/config/app"

export interface AppTab {
  key: string
  title: string
  fullPath: string
  closable: boolean
}

const HOME_TAB: AppTab = {
  key: "/",
  title: "首页",
  fullPath: "/",
  closable: true,
}

function titleFromRoute(route: RouteLocationNormalizedLoaded): string {
  const metaTitle = typeof route.meta.title === "string" ? route.meta.title.trim() : ""
  if (metaTitle) return metaTitle

  const name = typeof route.name === "string" ? route.name.trim() : ""
  if (name) return name

  const path = typeof route.path === "string" ? route.path.trim() : ""
  if (path) return path

  return "页面"
}

function isTabbableRoute(route: RouteLocationNormalizedLoaded): boolean {
  return route.meta.public !== true
}

export const useTabsStore = defineStore("tabs", () => {
  try {
    localStorage.removeItem("quantum:tabs")
  } catch {
    // ignore
  }

  const enabled = ref<boolean>(appConfig.enableTabs ?? true)
  const tabs = ref<AppTab[]>([])
  const activeKey = ref<string>("")
  const refreshKeyByTab = ref<Record<string, number>>({})

  const activeTab = computed(() => tabs.value.find((tab) => tab.key === activeKey.value) ?? null)

  function ensureAtLeastOneTab() {
    if (!enabled.value) return
    if (tabs.value.length === 0) tabs.value = [{ ...HOME_TAB }]
    if (!activeKey.value) activeKey.value = tabs.value[0]?.key ?? HOME_TAB.key
  }

  function getRefreshKey(tabKey: string): number {
    return refreshKeyByTab.value[tabKey] ?? 0
  }

  function openFromRoute(route: RouteLocationNormalizedLoaded) {
    if (!enabled.value) return
    if (!isTabbableRoute(route)) return

    ensureAtLeastOneTab()

    const key = route.fullPath
    if (key === HOME_TAB.key) {
      if (!tabs.value.some((tab) => tab.key === HOME_TAB.key)) {
        tabs.value.unshift({ ...HOME_TAB })
      }
      activeKey.value = HOME_TAB.key
      return
    }

    const title = titleFromRoute(route)
    const existing = tabs.value.find((tab) => tab.key === key)
    if (existing) {
      existing.title = title
      existing.fullPath = key
    } else {
      tabs.value.push({ key, title, fullPath: key, closable: true })
    }

    activeKey.value = key
  }

  function activate(tabKey: string) {
    activeKey.value = tabKey
  }

  function close(tabKey: string): string | null {
    const index = tabs.value.findIndex((tab) => tab.key === tabKey)
    if (index === -1) return null
    if (tabs.value.length <= 1) return null
    if (tabs.value[index]?.closable !== true) return null

    const wasActive = activeKey.value === tabKey
    tabs.value.splice(index, 1)
    delete refreshKeyByTab.value[tabKey]

    if (!wasActive) return null

    const next = tabs.value[index] ?? tabs.value[index - 1] ?? tabs.value[0] ?? HOME_TAB
    activeKey.value = next.key
    return next.fullPath
  }

  function closeOthers(tabKey: string): string | null {
    ensureAtLeastOneTab()

    const keep = new Set([tabKey])
    tabs.value = tabs.value.filter((tab) => keep.has(tab.key))
    ensureAtLeastOneTab()
    activeKey.value = tabs.value.some((tab) => tab.key === tabKey) ? tabKey : tabs.value[0]!.key

    for (const key of Object.keys(refreshKeyByTab.value)) {
      if (!keep.has(key)) delete refreshKeyByTab.value[key]
    }

    const target = tabs.value.find((tab) => tab.key === activeKey.value) ?? tabs.value[0]!
    return target.fullPath ?? "/"
  }

  function closeAll(): string | null {
    tabs.value = [{ ...HOME_TAB }]
    activeKey.value = HOME_TAB.key
    refreshKeyByTab.value = {}
    return HOME_TAB.fullPath
  }

  function refresh(tabKey: string) {
    refreshKeyByTab.value[tabKey] = (refreshKeyByTab.value[tabKey] ?? 0) + 1
  }

  function setEnabled(value: boolean) {
    enabled.value = value
    if (!value) {
      tabs.value = []
      activeKey.value = ""
      refreshKeyByTab.value = {}
      return
    }
    ensureAtLeastOneTab()
  }

  return {
    enabled,
    tabs,
    activeKey,
    activeTab,
    getRefreshKey,
    openFromRoute,
    activate,
    close,
    closeOthers,
    closeAll,
    refresh,
    setEnabled,
  }
})
