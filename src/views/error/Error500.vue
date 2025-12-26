<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #error-pages | Time: 2025-12-26T00:00:00+08:00
Principle: Internal errors must be visible and traceable.
Taste: Minimal shadcn-vue-style error page.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed } from "vue"
import { useRouter } from "vue-router"

import backgroundUrl from "@/assets/background.svg?url"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useErrorStore } from "@/stores/error"

const router = useRouter()
const errorStore = useErrorStore()
const { lastError } = storeToRefs(errorStore)

const message = computed(() => {
  if (lastError.value && lastError.value.code >= 500 && lastError.value.message)
    return lastError.value.message
  return "系统异常，请稍后重试。"
})

const traceId = computed(() =>
  lastError.value && lastError.value.code >= 500 ? (lastError.value.traceId ?? null) : null,
)

function goHome() {
  router.replace({ name: "home" })
}

function goLogin() {
  router.replace({ name: "login" })
}
</script>

<template>
  <main class="relative flex min-h-dvh items-center justify-center px-4 py-10">
    <div
      class="pointer-events-none absolute inset-0 z-0 bg-center bg-no-repeat opacity-70"
      :style="{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover' }"
    />
    <div
      class="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-background/20 to-background"
    />

    <Card class="relative z-10 w-full max-w-md">
      <CardHeader>
        <CardTitle>500 - 系统异常</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <p class="text-sm text-muted-foreground">{{ message }}</p>
        <p v-if="traceId" class="text-xs text-muted-foreground">
          TraceId: <span class="font-mono text-foreground">{{ traceId }}</span>
        </p>
      </CardContent>
      <CardFooter class="flex gap-2">
        <Button variant="outline" class="flex-1" @click="goLogin">返回登录</Button>
        <Button class="flex-1" @click="goHome">返回首页</Button>
      </CardFooter>
    </Card>
  </main>
</template>
