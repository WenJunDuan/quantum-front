// {{RIPER-10 Action}}
// Role: LD | Task_ID: #navigation | Time: 2025-12-27T00:00:00+08:00
// Principle: Avoid circular deps between router and request.
// Taste: Hold a router reference via explicit setter.

import type { Router } from "vue-router"

let appRouter: Router | null = null

export function setAppRouter(router: Router) {
  appRouter = router
}

export function getAppRouter() {
  return appRouter
}
