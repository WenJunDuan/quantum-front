<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #auth-guard | Time: 2025-12-26T00:00:00+08:00
Principle: Home should be gated by auth.
Taste: Minimal placeholder page.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { useRouter } from "vue-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { appConfig } from "@/config/app"
import { useUserStore } from "@/stores/user"

const router = useRouter()
const userStore = useUserStore()
const { accessToken } = storeToRefs(userStore)

function logout() {
  userStore.logout()
  router.replace({ name: "login" })
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
          <div>已登录</div>
          <div class="mt-1 font-mono text-xs break-all text-foreground">
            Token: {{ accessToken }}
          </div>
        </div>

        <Button variant="outline" @click="logout">退出登录</Button>
      </CardContent>
    </Card>
  </main>
</template>
