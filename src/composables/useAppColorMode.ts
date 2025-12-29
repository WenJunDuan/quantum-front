// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: User control over irreversible changes.
// Taste: Time-based default + manual override persisted in localStorage.

import { readonly, ref } from "vue"

type ColorModePreference = "auto" | "light" | "dark"

const STORAGE_KEY = "quantum:color-mode"
const DAY_START_MINUTES = 8 * 60
const NIGHT_START_MINUTES = 17 * 60 + 40

const isDark = ref(false)
const preference = ref<ColorModePreference>("auto")

let timerId: number | null = null
let inited = false

function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function shouldUseDarkByTime(date: Date) {
  const minutes = minutesOfDay(date)
  return minutes < DAY_START_MINUTES || minutes >= NIGHT_START_MINUTES
}

function computeDark(date: Date, pref: ColorModePreference) {
  if (pref === "dark") return true
  if (pref === "light") return false
  return shouldUseDarkByTime(date)
}

function applyColorMode(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle("dark", dark)
}

function stopSchedule() {
  if (timerId === null) return
  globalThis.clearTimeout(timerId)
  timerId = null
}

function getNextSwitchTime(now: Date) {
  const minutes = minutesOfDay(now)

  if (minutes >= DAY_START_MINUTES && minutes < NIGHT_START_MINUTES) {
    const next = new Date(now)
    next.setHours(17, 40, 0, 0)
    return next
  }

  const next = new Date(now)
  if (minutes < DAY_START_MINUTES) {
    next.setHours(8, 0, 0, 0)
  } else {
    next.setDate(next.getDate() + 1)
    next.setHours(8, 0, 0, 0)
  }
  return next
}

function scheduleNext(now: Date) {
  stopSchedule()

  const next = getNextSwitchTime(now)
  const delay = next.getTime() - now.getTime()

  timerId = globalThis.setTimeout(
    () => {
      if (preference.value !== "auto") return

      const current = new Date()
      applyColorMode(computeDark(current, preference.value))
      scheduleNext(current)
    },
    Math.max(0, delay) + 250,
  )
}

function readPreference(): ColorModePreference {
  const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
  if (raw === "light" || raw === "dark" || raw === "auto") return raw
  return "auto"
}

function persistPreference(pref: ColorModePreference) {
  globalThis.localStorage?.setItem(STORAGE_KEY, pref)
}

function setPreference(next: ColorModePreference) {
  preference.value = next
  persistPreference(next)

  const now = new Date()
  applyColorMode(computeDark(now, next))

  if (next === "auto") scheduleNext(now)
  else stopSchedule()
}

function toggleColorMode() {
  setPreference(isDark.value ? "light" : "dark")
}

function initAppColorMode() {
  if (inited) return
  inited = true

  const pref = readPreference()
  preference.value = pref

  const now = new Date()
  applyColorMode(computeDark(now, pref))
  if (pref === "auto") scheduleNext(now)
}

export function useAppColorMode() {
  initAppColorMode()
  return {
    isDark: readonly(isDark),
    preference: readonly(preference),
    setPreference,
    toggleColorMode,
  }
}
