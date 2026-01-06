import type { ComputedRef } from "vue"

import { useColorMode as useVueUseColorMode } from "@vueuse/core"
import { computed, readonly } from "vue"

export type ColorModePreference = "light" | "dark" | "auto"

const STORAGE_KEY = "app:color-mode"
const LEGACY_STORAGE_KEY = "quantum:color-mode"

let inited = false

function migrateLegacyPreference() {
  if (inited) return
  inited = true

  try {
    if (typeof localStorage === "undefined") return
    if (localStorage.getItem(STORAGE_KEY)) return

    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacy === "light" || legacy === "dark" || legacy === "auto") {
      localStorage.setItem(STORAGE_KEY, legacy)
    }
  } catch {
    // ignore storage failures
  }
}

interface UseColorModeReturn {
  isDark: Readonly<ComputedRef<boolean>>
  preference: Readonly<ComputedRef<ColorModePreference>>
  setPreference: (pref: ColorModePreference) => void
  toggleColorMode: () => void
}

let cached: UseColorModeReturn | undefined

export function useAppColorMode() {
  if (cached) return cached

  migrateLegacyPreference()

  const mode = useVueUseColorMode({
    attribute: "class",
    modes: { light: "light", dark: "dark" },
    storageKey: STORAGE_KEY,
    initialValue: "auto",
  })

  const isDark = computed(() => mode.value === "dark")
  const preference = computed<ColorModePreference>(() => {
    const stored = mode.store.value
    return stored === "light" || stored === "dark" ? stored : "auto"
  })

  cached = {
    isDark: readonly(isDark),
    preference: readonly(preference),
    setPreference: (pref: ColorModePreference) => {
      mode.store.value = pref
    },
    toggleColorMode: () => {
      mode.value = mode.value === "dark" ? "light" : "dark"
    },
  }

  return cached
}
