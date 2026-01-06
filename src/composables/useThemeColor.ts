import type { Ref } from "vue"

import { ref } from "vue"

export type ThemeColor =
  | "default"
  | "red"
  | "rose"
  | "orange"
  | "green"
  | "blue"
  | "yellow"
  | "violet"

const STORAGE_KEY = "app:theme-color"
const LEGACY_STORAGE_KEY = "quantum:accent-color"

interface ThemeColorConfig {
  primary: string
  primaryForeground: string
  ring: string
}

const themeColors: Record<ThemeColor, { light: ThemeColorConfig; dark: ThemeColorConfig }> = {
  default: {
    light: {
      primary: "oklch(0.205 0 0)",
      primaryForeground: "oklch(0.985 0 0)",
      ring: "oklch(0.708 0 0)",
    },
    dark: {
      primary: "oklch(0.922 0 0)",
      primaryForeground: "oklch(0.205 0 0)",
      ring: "oklch(0.556 0 0)",
    },
  },
  red: {
    light: {
      primary: "oklch(0.637 0.237 25.331)",
      primaryForeground: "oklch(0.971 0.013 17.38)",
      ring: "oklch(0.637 0.237 25.331)",
    },
    dark: {
      primary: "oklch(0.637 0.237 25.331)",
      primaryForeground: "oklch(0.971 0.013 17.38)",
      ring: "oklch(0.637 0.237 25.331)",
    },
  },
  rose: {
    light: {
      primary: "oklch(0.645 0.246 16.439)",
      primaryForeground: "oklch(0.969 0.015 12.422)",
      ring: "oklch(0.645 0.246 16.439)",
    },
    dark: {
      primary: "oklch(0.645 0.246 16.439)",
      primaryForeground: "oklch(0.969 0.015 12.422)",
      ring: "oklch(0.645 0.246 16.439)",
    },
  },
  orange: {
    light: {
      primary: "oklch(0.705 0.213 47.604)",
      primaryForeground: "oklch(0.98 0.016 73.684)",
      ring: "oklch(0.705 0.213 47.604)",
    },
    dark: {
      primary: "oklch(0.705 0.213 47.604)",
      primaryForeground: "oklch(0.98 0.016 73.684)",
      ring: "oklch(0.705 0.213 47.604)",
    },
  },
  green: {
    light: {
      primary: "oklch(0.723 0.219 149.579)",
      primaryForeground: "oklch(0.982 0.018 155.826)",
      ring: "oklch(0.723 0.219 149.579)",
    },
    dark: {
      primary: "oklch(0.723 0.219 149.579)",
      primaryForeground: "oklch(0.982 0.018 155.826)",
      ring: "oklch(0.723 0.219 149.579)",
    },
  },
  blue: {
    light: {
      primary: "oklch(0.623 0.214 259.815)",
      primaryForeground: "oklch(0.97 0.014 254.604)",
      ring: "oklch(0.623 0.214 259.815)",
    },
    dark: {
      primary: "oklch(0.623 0.214 259.815)",
      primaryForeground: "oklch(0.97 0.014 254.604)",
      ring: "oklch(0.623 0.214 259.815)",
    },
  },
  yellow: {
    light: {
      primary: "oklch(0.795 0.184 86.047)",
      primaryForeground: "oklch(0.421 0.095 57.708)",
      ring: "oklch(0.795 0.184 86.047)",
    },
    dark: {
      primary: "oklch(0.795 0.184 86.047)",
      primaryForeground: "oklch(0.421 0.095 57.708)",
      ring: "oklch(0.795 0.184 86.047)",
    },
  },
  violet: {
    light: {
      primary: "oklch(0.606 0.25 292.717)",
      primaryForeground: "oklch(0.969 0.016 293.756)",
      ring: "oklch(0.606 0.25 292.717)",
    },
    dark: {
      primary: "oklch(0.606 0.25 292.717)",
      primaryForeground: "oklch(0.969 0.016 293.756)",
      ring: "oklch(0.606 0.25 292.717)",
    },
  },
}

function isThemeColor(value: string | null): value is ThemeColor {
  if (!value) return false
  return Object.prototype.hasOwnProperty.call(themeColors, value)
}

function migrateFromLegacyAccent(): ThemeColor | null {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacy) return null

    if (legacy === "blue") return "blue"
    if (legacy === "red") return "red"
    if (legacy === "orange") return "orange"
    if (legacy === "yellow") return "yellow"
    if (legacy === "green") return "green"
    if (legacy === "pink") return "rose"
    if (legacy === "purple") return "violet"
    if (legacy === "indigo") return "violet"
    if (legacy === "teal") return "blue"
    if (legacy === "custom") return "blue"
    return null
  } catch {
    return null
  }
}

function readStoredThemeColor(): ThemeColor {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isThemeColor(stored)) return stored

    if (stored === null) {
      const migrated = migrateFromLegacyAccent()
      if (migrated) {
        localStorage.setItem(STORAGE_KEY, migrated)
        return migrated
      }
    }
  } catch {
    // ignore storage failures
  }

  return "default"
}

function applyThemeColor(color: ThemeColor) {
  if (typeof document === "undefined") return

  const isDark = document.documentElement.classList.contains("dark")
  const theme = themeColors[color][isDark ? "dark" : "light"]

  const root = document.documentElement
  root.style.setProperty("--primary", theme.primary)
  root.style.setProperty("--primary-foreground", theme.primaryForeground)
  root.style.setProperty("--ring", theme.ring)
}

interface UseThemeColorReturn {
  themeColor: Ref<ThemeColor>
  setThemeColor: (color: ThemeColor) => void
  themeColors: readonly ThemeColor[]
}

let cached: UseThemeColorReturn | undefined

export function useThemeColor(): UseThemeColorReturn {
  if (cached) return cached

  const themeColor = ref<ThemeColor>(
    typeof localStorage === "undefined" ? "default" : readStoredThemeColor(),
  )

  function setThemeColor(color: ThemeColor) {
    themeColor.value = color

    try {
      localStorage.setItem(STORAGE_KEY, color)
    } catch {
      // ignore storage failures
    }

    applyThemeColor(color)
  }

  if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => {
      applyThemeColor(themeColor.value)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  }

  applyThemeColor(themeColor.value)

  cached = {
    themeColor,
    setThemeColor,
    themeColors: Object.keys(themeColors) as ThemeColor[],
  }

  return cached
}
