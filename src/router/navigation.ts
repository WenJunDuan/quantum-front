import type { Router } from "vue-router"

let appRouter: Router | null = null

export function setAppRouter(router: Router) {
  appRouter = router
}

export function getAppRouter() {
  return appRouter
}
