// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Routes are part of the public API surface.
// Taste: Keep routing small, lazy-loaded, and predictable.

import { createRouter, createWebHistory } from "vue-router"

import { appConfig } from "@/config/app"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
      meta: { title: "Home" },
    },
    {
      path: "/about",
      name: "about",
      component: () => import("@/views/AboutView.vue"),
      meta: { title: "About" },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.afterEach((to) => {
  let routeTitle: string | null = null
  if (typeof to.meta.title === "string") routeTitle = to.meta.title

  document.title = routeTitle ? `${routeTitle} | ${appConfig.title}` : appConfig.title
})

export default router
