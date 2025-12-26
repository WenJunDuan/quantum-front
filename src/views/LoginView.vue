<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #login | Time: 2025-12-26T00:00:00+08:00
Principle: Keep the first page focused and predictable.
Taste: Simple, clean shadcn-vue-style login form.
-->

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { useRoute, useRouter } from "vue-router"

import { createCaptcha, login } from "@/api/auth"
import backgroundUrl from "@/assets/background.svg?url"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { appConfig } from "@/config/app"
import { useNotifyStore } from "@/stores/notify"
import { useUserStore } from "@/stores/user"

const formRef = ref<HTMLFormElement | null>(null)
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const notify = useNotifyStore()

const username = ref("")
const password = ref("")
const captchaCode = ref("")
const rememberPassword = ref(true)
const isSubmitting = ref(false)

const captchaKey = ref("")
const captchaImageUrl = ref<string | null>(null)
const captchaLength = ref<number | null>(null)
const isCaptchaLoading = ref(false)

function normalizeCaptchaImageSrc(image: string) {
  if (image.startsWith("data:")) return image
  return `data:image/png;base64,${image}`
}

async function fetchCaptcha() {
  if (isCaptchaLoading.value) return
  isCaptchaLoading.value = true

  try {
    const result = await createCaptcha()
    captchaKey.value = result.key
    captchaLength.value = result.length
    captchaImageUrl.value = normalizeCaptchaImageSrc(result.image)
    captchaCode.value = ""
  } finally {
    isCaptchaLoading.value = false
  }
}

function refreshCaptcha() {
  void fetchCaptcha().catch(() => null)
}

function requestSubmit() {
  formRef.value?.requestSubmit()
}

async function onSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    if (!captchaKey.value) await fetchCaptcha().catch(() => null)
    if (!captchaKey.value) return

    const response = await login({
      username: username.value.trim(),
      password: password.value,
      captchaKey: captchaKey.value,
      captchaCode: captchaCode.value.trim(),
      rememberMe: rememberPassword.value,
    })

    userStore.setTokens({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken ?? null,
    })

    const redirect =
      typeof route.query.redirect === "string" && route.query.redirect.startsWith("/")
        ? route.query.redirect
        : "/"

    await router.replace(redirect)
  } catch {
    await fetchCaptcha().catch(() => null)
  } finally {
    isSubmitting.value = false
  }
}

function onForgotPassword() {
  notify.info("请联系管理员重置密码")
}

const captchaButtonText = computed(() => {
  if (isCaptchaLoading.value) return "加载中..."
  if (!captchaImageUrl.value) return "点击获取"
  return ""
})

onMounted(() => {
  void fetchCaptcha().catch(() => null)
})
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
                  aria-label="Refresh captcha"
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
