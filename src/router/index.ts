// {{RIPER-10 Action}}
// Role: LD | Task_ID: #fix-router | Time: 2025-12-27T00:00:00+08:00
// Principle: Routes are part of the public API surface.
// Taste: Keep routing small, lazy-loaded, and predictable.

import NProgress from "nprogress"
import { createRouter, createWebHistory } from "vue-router"
import "nprogress/nprogress.css"

import { getUserInfo } from "@/api/auth"
import { appConfig } from "@/config/app"
import { registerDynamicRoutes, resetDynamicRoutes } from "@/router/dynamic"
import { setAppRouter } from "@/router/navigation"
import { useNotifyStore } from "@/stores/notify"
import { useUserStore } from "@/stores/user"

NProgress.configure({ showSpinner: false })

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
      meta: { title: "登录", public: true },
    },
    {
      path: "/error/400",
      name: "error-400",
      component: () => import("@/views/error/Error400.vue"),
      meta: { title: "请求错误", public: true },
    },
    {
      path: "/error/404",
      name: "error-404",
      component: () => import("@/views/error/Error404.vue"),
      meta: { title: "页面不存在", public: true },
    },
    {
      path: "/error/500",
      name: "error-500",
      component: () => import("@/views/error/Error500.vue"),
      meta: { title: "系统异常", public: true },
    },
    {
      path: "/:pathMatch(.*)*",
      name: "not-found",
      component: () => import("@/views/error/Error404.vue"),
      meta: { title: "页面不存在", public: true },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

setAppRouter(router)

router.beforeEach(async (to) => {
  NProgress.start()
  const userStore = useUserStore()
  const notify = useNotifyStore()
  const isPublicRoute = to.meta.public === true

  // ========== 未登录处理 ==========
  const token = userStore.accessToken
  if (!token) {
    resetDynamicRoutes(router)
    userStore.logout()

    if (!isPublicRoute) {
      return {
        name: "login",
        query: { redirect: to.fullPath },
      }
    }

    return true
  }

  // ========== 已登录访问登录页，重定向到首页 ==========
  if (to.name === "login") {
    return { name: "home" }
  }

  // ========== 加载用户信息 ==========
  if (!userStore.isUserInfoLoaded) {
    try {
      const info = await getUserInfo()
      userStore.setUserInfo(info)
    } catch (error) {
      // Token 可能已失效，清理并跳转登录
      console.error("[Router] Failed to get user info:", error)
      userStore.logout()
      notify.error("获取用户信息失败，请重新登录")
      return {
        name: "login",
        query: { redirect: to.fullPath },
      }
    }
  }

  // ========== 注册动态路由 ==========
  if (!userStore.areDynamicRoutesReady) {
    registerDynamicRoutes(router, "root", userStore.routers)
    userStore.markDynamicRoutesReady()
    return { path: to.fullPath, replace: true }
  }

  // ========== 角色权限检查 ==========
  const requiredRoles = Array.isArray(to.meta.roles)
    ? to.meta.roles.filter((value) => typeof value === "string")
    : []
  if (requiredRoles.length > 0 && !userStore.hasAnyRole(requiredRoles)) {
    notify.error("无权限访问")
    return { name: "error-404" }
  }

  // ========== 权限标识检查 ==========
  const requiredPermission = typeof to.meta.permission === "string" ? to.meta.permission.trim() : ""
  if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
    notify.error("无权限访问")
    return { name: "error-404" }
  }

  return true
})

router.afterEach((to) => {
  NProgress.done()
  let routeTitle: string | null = null
  if (typeof to.meta.title === "string") routeTitle = to.meta.title

  document.title = routeTitle ? `${routeTitle} | ${appConfig.title}` : appConfig.title
})

router.onError(() => {
  NProgress.done()
})

export default router
