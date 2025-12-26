// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Configuration over conditionals; reuse proven primitives.
// Taste: Time-based day/night mode with minimal moving parts.

import { readonly, ref } from "vue"

const DAY_START_MINUTES = 8 * 60
const NIGHT_START_MINUTES = 17 * 60 + 40

const isDark = ref(false)
let timerId: number | null = null
let inited = false

function minutesOfDay(date: Date) {
  return date.getHours() * 60 + date.getMinutes()
}

function shouldUseDark(date: Date) {
  const minutes = minutesOfDay(date)
  return minutes < DAY_START_MINUTES || minutes >= NIGHT_START_MINUTES
}

function applyColorMode(dark: boolean) {
  isDark.value = dark
  document.documentElement.classList.toggle("dark", dark)
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
  if (timerId !== null) globalThis.clearTimeout(timerId)

  const next = getNextSwitchTime(now)
  const delay = next.getTime() - now.getTime()

  timerId = globalThis.setTimeout(
    () => {
      const current = new Date()
      applyColorMode(shouldUseDark(current))
      scheduleNext(current)
    },
    Math.max(0, delay) + 250,
  )
}

function initAppColorMode() {
  if (inited) return
  inited = true

  const now = new Date()
  applyColorMode(shouldUseDark(now))
  scheduleNext(now)
}

export function useAppColorMode() {
  initAppColorMode()
  return { isDark: readonly(isDark) }
}
