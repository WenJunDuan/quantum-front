<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #fix-layout | Time: 2025-12-27T00:00:00+08:00
Principle: Layout owns shell; pages own content.
Taste: Minimal app layout wrapper (menu added separately).
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, ref } from "vue"
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router"

import { logout as apiLogout } from "@/api/auth"
import AppMenuTree from "@/components/AppMenuTree.vue"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { appConfig } from "@/config/app"
import { useUserStore } from "@/stores/user"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { profile, routers } = storeToRefs(userStore)

const isLoggingOut = ref(false)

const displayName = computed(() => profile.value?.nickname ?? profile.value?.username ?? "用户")

const pageTitle = computed(() => {
  if (typeof route.meta.title === "string" && route.meta.title.trim()) return route.meta.title
  return appConfig.title
})

async function logout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  try {
    // 调用后端登出接口
    await apiLogout()
  } catch (error) {
    // 忽略错误，无论如何都要清理本地状态
    console.warn("[Logout] API call failed:", error)
  } finally {
    // 清理本地状态
    userStore.logout()
    isLoggingOut.value = false
    // 跳转登录页
    router.replace({ name: "login" })
  }
}
</script>

<template>
  <div class="flex min-h-dvh bg-background text-foreground">
    <!-- 侧边栏 -->
    <aside class="flex w-64 flex-col border-r bg-background/60 backdrop-blur">
      <!-- Logo & 用户信息 -->
      <div class="p-4">
        <div class="text-sm font-semibold">{{ appConfig.title }}</div>
        <div class="mt-1 text-xs text-muted-foreground">你好，{{ displayName }}</div>
      </div>

      <Separator class="opacity-60" />

      <!-- 导航菜单 -->
      <nav class="flex-1 overflow-auto p-2">
        <Button as-child variant="ghost" class="h-9 w-full justify-start pl-2">
          <RouterLink to="/">首页</RouterLink>
        </Button>

        <div v-if="routers.length > 0" class="mt-2">
          <AppMenuTree :items="routers" />
        </div>
      </nav>

      <Separator class="opacity-60" />

      <!-- 登出按钮 -->
      <div class="p-4">
        <Button variant="outline" class="w-full" :disabled="isLoggingOut" @click="logout">
          {{ isLoggingOut ? "退出中..." : "退出登录" }}
        </Button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- 顶部栏 -->
      <header class="flex h-14 items-center justify-between border-b px-4">
        <div class="min-w-0 truncate text-sm font-medium">{{ pageTitle }}</div>
        <div class="text-xs text-muted-foreground">{{ displayName }}</div>
      </header>

      <!-- 页面内容 -->
      <main class="min-h-0 flex-1 overflow-auto p-4">
        <RouterView />
      </main>
    </div>
  </div>
</template>
