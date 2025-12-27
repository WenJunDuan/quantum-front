<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #fix-home | Time: 2025-12-27T00:00:00+08:00
Principle: Home should be gated by auth.
Taste: Minimal placeholder page.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { ref } from "vue"
import { useRouter } from "vue-router"

import { logout as apiLogout } from "@/api/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { appConfig } from "@/config/app"
import { useUserStore } from "@/stores/user"

const router = useRouter()
const userStore = useUserStore()
const { accessToken, profile } = storeToRefs(userStore)

const isLoggingOut = ref(false)

async function logout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true

  try {
    await apiLogout()
  } catch (error) {
    console.warn("[Logout] API call failed:", error)
  } finally {
    userStore.logout()
    isLoggingOut.value = false
    router.replace({ name: "login" })
  }
}
</script>

<template>
  <main class="mx-auto max-w-5xl p-6">
    <Card>
      <CardHeader>
        <CardTitle>{{ appConfig.title }}</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-sm text-muted-foreground">
          <div>已登录：{{ profile?.nickname ?? profile?.username ?? "用户" }}</div>
          <div class="mt-1 font-mono text-xs break-all text-foreground">
            Token: {{ accessToken }}
          </div>
        </div>

        <Button variant="outline" :disabled="isLoggingOut" @click="logout">
          {{ isLoggingOut ? "退出中..." : "退出登录" }}
        </Button>
      </CardContent>
    </Card>
  </main>
</template>
