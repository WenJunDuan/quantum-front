// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Configuration over conditionals; reuse proven primitives.
// Taste: Delegate dark-mode plumbing to VueUse; expose a tiny API.

import { useDark, useToggle } from "@vueuse/core"

export function useAppColorMode() {
  const isDark = useDark({
    selector: "html",
    attribute: "class",
    valueDark: "dark",
    valueLight: "",
  })

  const toggle = useToggle(isDark)

  return { isDark, toggle }
}
