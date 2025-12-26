// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Routes are part of the public API surface.
// Taste: Keep routing small, lazy-loaded, and predictable.

import { getActivePinia } from "pinia"
import { createRouter, createWebHistory } from "vue-router"

import { appConfig } from "@/config/app"
import { useUserStore } from "@/stores/user"

function safeUserStore() {
  if (!getActivePinia()) return null
  try {
    return useUserStore()
  } catch {
    return null
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
      meta: { title: "首页", requiresAuth: true },
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { title: "登录" },
    },
    {
      path: "/error/400",
      name: "error-400",
      component: () => import("@/views/error/Error400.vue"),
      meta: { title: "请求错误" },
    },
    {
      path: "/error/404",
      name: "error-404",
      component: () => import("@/views/error/Error404.vue"),
      meta: { title: "页面不存在" },
    },
    {
      path: "/error/500",
      name: "error-500",
      component: () => import("@/views/error/Error500.vue"),
      meta: { title: "系统异常" },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "error-404" },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const token = safeUserStore()?.accessToken

  if (to.meta.requiresAuth === true && !token) {
    return {
      name: "login",
      query: { redirect: to.fullPath },
    }
  }

  if (to.name === "login" && token) {
    return { name: "home" }
  }

  return true
})

router.afterEach((to) => {
  let routeTitle: string | null = null
  if (typeof to.meta.title === "string") routeTitle = to.meta.title

  document.title = routeTitle ? `${routeTitle} | ${appConfig.title}` : appConfig.title
})

export default router
