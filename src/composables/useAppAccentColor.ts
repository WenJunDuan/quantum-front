// {{RIPER-10 Action}}
// Role: LD | Task_ID: #theme-accent | Time: 2025-12-29T00:00:00+08:00
// Principle: Theme is data; components read tokens, not hardcoded colors.
// Taste: Small palette, persisted choice, applied via CSS variables.

import { readonly, ref } from "vue"

export type AccentColorKey =
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "teal"
  | "indigo"
  | "custom"

export interface AccentColorOption {
  key: AccentColorKey
  label: string
  light: string
  dark: string
}

const DEFAULT_CUSTOM_COLOR = "#636366"

const ACCENT_OPTIONS: AccentColorOption[] = [
  { key: "blue", label: "蓝色", light: "#007AFF", dark: "#0A84FF" },
  { key: "purple", label: "紫色", light: "#AF52DE", dark: "#BF5AF2" },
  { key: "orange", label: "橙色", light: "#FF9500", dark: "#FF9F0A" },
  { key: "pink", label: "粉色", light: "#FF2D55", dark: "#FF375F" },
  { key: "red", label: "红色", light: "#FF3B30", dark: "#FF453A" },
  { key: "yellow", label: "黄色", light: "#FFCC00", dark: "#FFD60A" },
  { key: "green", label: "绿色", light: "#34C759", dark: "#30D158" },
  { key: "teal", label: "青色", light: "#32ADE6", dark: "#64D2FF" },
  { key: "indigo", label: "靛蓝", light: "#5856D6", dark: "#5E5CE6" },
  { key: "custom", label: "自定义", light: DEFAULT_CUSTOM_COLOR, dark: "#8E8E93" },
]

const STORAGE_KEY = "quantum:accent-color"
const CUSTOM_COLOR_STORAGE_KEY = "quantum:accent-custom-color"

const accentKey = ref<AccentColorKey>("blue")
const customColor = ref<string>(DEFAULT_CUSTOM_COLOR)

let inited = false

function isValidKey(value: string): value is AccentColorKey {
  return ACCENT_OPTIONS.some((option) => option.key === value)
}

function normalizeHexColor(value: string): string | null {
  const raw = value.trim()
  const match = /^#([0-9a-fA-F]{6})$/.exec(raw)
  if (!match) return null
  return `#${match[1]!.toUpperCase()}`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColor(hex)
  if (!normalized) return null

  const value = normalized.slice(1)
  const r = Number.parseInt(value.slice(0, 2), 16)
  const g = Number.parseInt(value.slice(2, 4), 16)
  const b = Number.parseInt(value.slice(4, 6), 16)
  return { r, g, b }
}

function clampRgbChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)))
}

function channelToHex(value: number): string {
  return clampRgbChannel(value).toString(16).padStart(2, "0").toUpperCase()
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return `#${channelToHex(rgb.r)}${channelToHex(rgb.g)}${channelToHex(rgb.b)}`
}

function mixHex(fromHex: string, toHex: string, amount: number): string {
  const from = hexToRgb(fromHex)
  const to = hexToRgb(toHex)
  if (!from || !to) return DEFAULT_CUSTOM_COLOR

  const t = Math.min(1, Math.max(0, amount))
  return rgbToHex({
    r: from.r + (to.r - from.r) * t,
    g: from.g + (to.g - from.g) * t,
    b: from.b + (to.b - from.b) * t,
  })
}

function deriveDarkAccent(lightHex: string): string {
  const normalized = normalizeHexColor(lightHex) ?? DEFAULT_CUSTOM_COLOR
  return mixHex(normalized, "#FFFFFF", 0.18)
}

function readAccentKey(): AccentColorKey {
  const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
  if (raw === "gray") return "custom"
  if (typeof raw === "string" && isValidKey(raw)) return raw
  return "blue"
}

function persistAccentKey(value: AccentColorKey) {
  globalThis.localStorage?.setItem(STORAGE_KEY, value)
}

function readCustomColor(): string {
  const raw = globalThis.localStorage?.getItem(CUSTOM_COLOR_STORAGE_KEY)
  if (typeof raw === "string") return normalizeHexColor(raw) ?? DEFAULT_CUSTOM_COLOR
  return DEFAULT_CUSTOM_COLOR
}

function persistCustomColor(value: string) {
  const normalized = normalizeHexColor(value)
  if (!normalized) return
  globalThis.localStorage?.setItem(CUSTOM_COLOR_STORAGE_KEY, normalized)
}

function optionByKey(key: AccentColorKey): AccentColorOption {
  return ACCENT_OPTIONS.find((option) => option.key === key) ?? ACCENT_OPTIONS[0]!
}

function applyAccent(key: AccentColorKey) {
  if (key === "custom") {
    const light = normalizeHexColor(customColor.value) ?? DEFAULT_CUSTOM_COLOR
    const dark = deriveDarkAccent(light)
    document.documentElement.style.setProperty("--accent-primary-light", light)
    document.documentElement.style.setProperty("--accent-primary-dark", dark)
    return
  }

  const option = optionByKey(key)
  document.documentElement.style.setProperty("--accent-primary-light", option.light)
  document.documentElement.style.setProperty("--accent-primary-dark", option.dark)
}

function initAppAccentColor() {
  if (inited) return
  inited = true

  customColor.value = readCustomColor()

  const key = readAccentKey()
  accentKey.value = key
  applyAccent(key)
}

function setAccentKey(key: AccentColorKey) {
  accentKey.value = key
  persistAccentKey(key)
  applyAccent(key)
}

function setCustomColor(value: string) {
  const normalized = normalizeHexColor(value)
  if (!normalized) return

  customColor.value = normalized
  persistCustomColor(normalized)

  if (accentKey.value === "custom") applyAccent("custom")
}

export function useAppAccentColor() {
  initAppAccentColor()
  return {
    accentKey: readonly(accentKey),
    customColor: readonly(customColor),
    options: readonly(ACCENT_OPTIONS),
    setAccentKey,
    setCustomColor,
  }
}
