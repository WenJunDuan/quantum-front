<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #rbac | Time: 2025-12-27T00:00:00+08:00
Principle: Unknown backend components must not crash routing.
Taste: Provide a clear placeholder page.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed } from "vue"
import { useRoute, useRouter } from "vue-router"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useUserStore } from "@/stores/user"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const { profile } = storeToRefs(userStore)

const title = computed(() => {
  if (typeof route.meta.title === "string" && route.meta.title.trim()) return route.meta.title
  if (typeof route.name === "string" && route.name.trim()) return route.name
  return "页面建设中"
})

const fullPath = computed(() => route.fullPath)

const nickname = computed(() => profile.value?.nickname ?? profile.value?.username ?? "用户")

function goHome() {
  router.replace({ name: "home" })
}
</script>

<template>
  <main class="mx-auto max-w-3xl p-6">
    <Card>
      <CardHeader>
        <CardTitle>{{ title }}</CardTitle>
      </CardHeader>
      <CardContent class="space-y-2">
        <p class="text-sm text-muted-foreground">你好，{{ nickname }}。该页面前端组件尚未实现。</p>
        <p class="text-sm text-muted-foreground">
          当前路径：<span class="font-mono text-foreground">{{ fullPath }}</span>
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" @click="goHome">返回首页</Button>
      </CardFooter>
    </Card>
  </main>
</template>
