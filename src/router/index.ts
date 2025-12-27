// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Routes are part of the public API surface.
// Taste: Keep routing small, lazy-loaded, and predictable.

import { getActivePinia } from "pinia"
import { createRouter, createWebHistory } from "vue-router"

import { getUserInfo } from "@/api/auth"
import { appConfig } from "@/config/app"
import { registerDynamicRoutes, resetDynamicRoutes } from "@/router/dynamic"
import { setAppRouter } from "@/router/navigation"
import { useNotifyStore } from "@/stores/notify"
import { useUserStore } from "@/stores/user"

function safeUserStore() {
  if (!getActivePinia()) return null
  try {
    return useUserStore()
  } catch {
    return null
  }
}

function safeNotifyStore() {
  if (!getActivePinia()) return null
  try {
    return useNotifyStore()
  } catch {
    return null
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "root",
      component: () => import("@/layouts/AppLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/views/HomeView.vue"),
          meta: { title: "首页" },
        },
      ],
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
      name: "not-found",
      component: () => import("@/views/error/Error404.vue"),
      meta: { title: "页面不存在" },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

setAppRouter(router)

router.beforeEach(async (to) => {
  const userStore = safeUserStore()
  const notify = safeNotifyStore()

  const token = userStore?.accessToken
  if (!token) {
    resetDynamicRoutes(router)
    userStore?.clearUserInfo()

    if (to.meta.requiresAuth === true) {
      return {
        name: "login",
        query: { redirect: to.fullPath },
      }
    }

    return true
  }

  if (to.name === "login") return { name: "home" }

  if (!userStore) return true

  if (!userStore.isUserInfoLoaded) {
    try {
      const info = await getUserInfo()
      userStore.setUserInfo(info)
    } catch {
      return false
    }
  }

  if (!userStore.areDynamicRoutesReady) {
    registerDynamicRoutes(router, "root", userStore.routers)
    userStore.markDynamicRoutesReady()
    return { path: to.fullPath, replace: true }
  }

  const requiredRoles = Array.isArray(to.meta.roles)
    ? to.meta.roles.filter((value) => typeof value === "string")
    : []
  if (requiredRoles.length > 0 && !userStore.hasAnyRole(requiredRoles)) {
    notify?.error("无权限访问")
    return { name: "error-404" }
  }

  const requiredPermission = typeof to.meta.permission === "string" ? to.meta.permission.trim() : ""
  if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
    notify?.error("无权限访问")
    return { name: "error-404" }
  }

  return true
})

router.afterEach((to) => {
  let routeTitle: string | null = null
  if (typeof to.meta.title === "string") routeTitle = to.meta.title

  document.title = routeTitle ? `${routeTitle} | ${appConfig.title}` : appConfig.title
})

export default router
