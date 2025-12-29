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

export interface AccentColorOption {
  key: AccentColorKey
  label: string
  light: string
  dark: string
}

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
]

const STORAGE_KEY = "quantum:accent-color"

const accentKey = ref<AccentColorKey>("blue")

let inited = false

function isValidKey(value: string): value is AccentColorKey {
  return ACCENT_OPTIONS.some((option) => option.key === value)
}

function readAccentKey(): AccentColorKey {
  const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
  if (typeof raw === "string" && isValidKey(raw)) return raw
  return "blue"
}

function persistAccentKey(value: AccentColorKey) {
  globalThis.localStorage?.setItem(STORAGE_KEY, value)
}

function optionByKey(key: AccentColorKey): AccentColorOption {
  return ACCENT_OPTIONS.find((option) => option.key === key) ?? ACCENT_OPTIONS[0]!
}

function applyAccent(key: AccentColorKey) {
  const option = optionByKey(key)
  document.documentElement.style.setProperty("--accent-primary-light", option.light)
  document.documentElement.style.setProperty("--accent-primary-dark", option.dark)
}

function initAppAccentColor() {
  if (inited) return
  inited = true

  const key = readAccentKey()
  accentKey.value = key
  applyAccent(key)
}

function setAccentKey(key: AccentColorKey) {
  accentKey.value = key
  persistAccentKey(key)
  applyAccent(key)
}

export function useAppAccentColor() {
  initAppAccentColor()
  return {
    accentKey: readonly(accentKey),
    options: readonly(ACCENT_OPTIONS),
    setAccentKey,
  }
}
