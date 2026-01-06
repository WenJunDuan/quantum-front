<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #fix-login | Time: 2025-12-27T00:00:00+08:00
File: src/views/auth/login/LoginView.vue
Principle: Keep the first page focused and predictable.
Taste: Simple, clean shadcn-vue-style login form.
-->

<script setup lang="ts">
import SHA256 from "crypto-js/sha256"
import { computed, onMounted, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"

import backgroundUrl from "@/assets/background.svg?url"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { appConfig } from "@/config/app"
import { useCaptchaQuery, useLoginMutation } from "@/queries/auth"

const formRef = ref<HTMLFormElement | null>(null)
const router = useRouter()
const route = useRoute()

const username = ref("")
const password = ref("")
const captchaCode = ref("")
const rememberPassword = ref(true)

const captchaQuery = useCaptchaQuery()
const captcha = computed(() => captchaQuery.data.value ?? null)
const captchaKey = computed(() => captcha.value?.key ?? "")
const captchaLength = computed(() => captcha.value?.length ?? null)
const captchaImageUrl = computed(() => {
  if (!captcha.value) return null
  return normalizeCaptchaImageSrc(captcha.value.image)
})
const isCaptchaLoading = computed(() => captchaQuery.isFetching.value)

const loginMutation = useLoginMutation()
const isSubmitting = computed(() => loginMutation.isPending.value)

const captchaRetryCount = ref(0)
const maxCaptchaRetries = 5

function normalizeCaptchaImageSrc(image: string) {
  if (image.startsWith("data:")) return image
  return `data:image/png;base64,${image}`
}

async function fetchCaptcha() {
  if (isCaptchaLoading.value) return

  // 限制重试次数
  if (captchaRetryCount.value >= maxCaptchaRetries) {
    toast.error("验证码加载失败次数过多，请稍后再试")
    return
  }

  const result = await captchaQuery.refetch()
  if (result.data) {
    captchaRetryCount.value = 0 // 成功后重置计数
    captchaCode.value = ""
    return
  }

  captchaRetryCount.value += 1
  console.error("[Login] Failed to fetch captcha:", result.error)
}

function refreshCaptcha() {
  void fetchCaptcha()
}

function requestSubmit() {
  formRef.value?.requestSubmit()
}

async function onSubmit() {
  if (isSubmitting.value) return
  try {
    // 确保有验证码
    if (!captchaKey.value) await fetchCaptcha()
    if (!captchaKey.value) {
      toast.error("请先获取验证码")
      return
    }

    const hashedPassword = SHA256(password.value).toString()

    // 登录请求
    await loginMutation.mutateAsync({
      username: username.value.trim(),
      password: hashedPassword,
      captchaKey: captchaKey.value,
      captchaCode: captchaCode.value.trim(),
      rememberMe: rememberPassword.value,
    })

    // 跳转
    const redirect =
      typeof route.query.redirect === "string" && route.query.redirect.startsWith("/")
        ? route.query.redirect
        : "/"

    await router.replace(redirect)
  } catch {
    // 登录失败，刷新验证码
    await fetchCaptcha()
  }
}

function onForgotPassword() {
  toast.info("请联系管理员重置密码")
}

const captchaButtonText = computed(() => {
  if (isCaptchaLoading.value) return "加载中..."
  if (!captchaImageUrl.value) return "点击获取"
  return ""
})

watch(captchaKey, (next, prev) => {
  if (next && next !== prev) captchaCode.value = ""
})

onMounted(() => {
  void fetchCaptcha()
})
</script>

<template>
  <main class="relative flex min-h-dvh items-center justify-center px-4 py-10">
    <!-- 背景 -->
    <div
      class="pointer-events-none absolute inset-0 z-0 bg-center bg-no-repeat opacity-70"
      :style="{ backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover' }"
    />
    <div
      class="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-background/20 to-background"
    />

    <!-- 登录表单 -->
    <div class="relative z-10 w-full max-w-sm">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-semibold tracking-tight">{{ appConfig.title }}</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ appConfig.description || "欢迎回来，请登录继续" }}
        </p>
      </div>

      <Card>
        <form
          ref="formRef"
          class="grid gap-6"
          @submit.prevent="onSubmit"
          @keydown.enter.prevent="requestSubmit"
        >
          <CardHeader>
            <CardTitle>登录</CardTitle>
          </CardHeader>

          <CardContent class="grid gap-4">
            <!-- 用户名 -->
            <div class="grid gap-2">
              <Label for="login-username">用户名</Label>
              <Input
                id="login-username"
                v-model="username"
                autocomplete="username"
                placeholder="请输入用户名"
                required
              />
            </div>

            <!-- 密码 -->
            <div class="grid gap-2">
              <Label for="login-password">密码</Label>
              <Input
                id="login-password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="请输入密码"
                required
              />
            </div>

            <!-- 验证码 -->
            <div class="grid gap-2">
              <Label for="login-captcha">验证码</Label>
              <div class="flex items-center gap-2">
                <Input
                  id="login-captcha"
                  v-model="captchaCode"
                  :maxlength="captchaLength ?? undefined"
                  autocomplete="off"
                  placeholder="请输入验证码"
                  required
                />

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  class="h-12 w-44 px-1 py-1"
                  aria-label="刷新验证码"
                  :disabled="isCaptchaLoading"
                  @click="refreshCaptcha"
                >
                  <img
                    v-if="captchaImageUrl"
                    :src="captchaImageUrl"
                    alt="captcha"
                    class="h-full w-full rounded-md object-contain"
                  />
                  <span v-else class="text-xs text-muted-foreground">{{ captchaButtonText }}</span>
                </Button>
              </div>
            </div>

            <!-- 记住密码 & 找回密码 -->
            <div class="flex items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <Checkbox id="login-remember" v-model="rememberPassword" />
                <Label for="login-remember" class="select-none">记住密码</Label>
              </div>

              <Button
                type="button"
                variant="link"
                class="h-auto p-0 text-sm"
                @click="onForgotPassword"
              >
                找回密码
              </Button>
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" class="w-full" :disabled="isSubmitting">
              {{ isSubmitting ? "登录中..." : "登录" }}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  </main>
</template>
