<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #user-profile | Time: 2025-12-29T00:00:00+08:00
File: src/views/system/user/ProfileView.vue
Principle: Forms should be calm, readable, and reversible.
Taste: Apple-like spacing, subtle separators, and high hit-targets.
-->

<script setup lang="ts">
import { storeToRefs } from "pinia"
import { computed, ref, watch } from "vue"
import { toast } from "vue-sonner"

import AppIcon from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useUserStore } from "@/stores/user"

const userStore = useUserStore()
const { profile } = storeToRefs(userStore)

const username = ref("")
const email = ref("")
const bio = ref("")
const urls = ref<string[]>(["https://shadcn.com", "http://twitter.com/shadcn"])

watch(
  () => profile.value,
  (next) => {
    if (!next) return
    username.value = next.nickname?.trim() || next.username?.trim() || username.value
    email.value = next.email?.trim() || email.value
    bio.value = next.remark?.trim() || bio.value
  },
  { immediate: true },
)

const canRemoveUrl = computed(() => urls.value.length > 1)

function addUrl() {
  urls.value = [...urls.value, ""]
}

function removeUrl(index: number) {
  if (!canRemoveUrl.value) return
  urls.value = urls.value.filter((_, i) => i !== index)
}

function save() {
  toast.info("保存接口尚未接入（当前为页面演示）")
}
</script>

<template>
  <div class="space-y-8">
    <div class="grid gap-2">
      <div class="text-[13px] font-medium">用户名</div>
      <Input v-model="username" autocomplete="username" placeholder="shadcn" />
      <p class="text-[12px] text-muted-foreground">
        这是你的公开显示名称，可以是真实姓名或昵称。为避免滥用，建议控制修改频率（例如 30 天一次）。
      </p>
    </div>

    <Separator class="opacity-60" />

    <div class="grid gap-2">
      <div class="text-[13px] font-medium">邮箱</div>
      <div class="relative">
        <AppIcon
          icon="radix-icons:envelope-closed"
          class="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="email"
          autocomplete="email"
          placeholder="选择要展示的已验证邮箱"
          class="pl-11"
        />
      </div>
      <p class="text-[12px] text-muted-foreground">你可以在邮箱设置中管理已验证的邮箱地址。</p>
    </div>

    <Separator class="opacity-60" />

    <div class="grid gap-2">
      <div class="text-[13px] font-medium">简介</div>
      <textarea
        v-model="bio"
        rows="4"
        placeholder="写一句话介绍你自己。"
        class="min-h-[7rem] w-full rounded-lg border border-input bg-background/60 px-4 py-3 text-[13px] shadow-sm backdrop-blur transition-colors outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p class="text-[12px] text-muted-foreground">你可以使用 @ 提及其他用户或组织以建立链接。</p>
    </div>

    <Separator class="opacity-60" />

    <div class="space-y-3">
      <div>
        <div class="text-[13px] font-medium">链接</div>
        <p class="mt-1 text-[12px] text-muted-foreground">添加你的网站、博客或社交媒体主页链接。</p>
      </div>

      <div class="grid gap-3">
        <div v-for="(value, index) in urls" :key="index" class="flex items-center gap-2">
          <Input v-model="urls[index]" placeholder="https://example.com" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="rounded-full"
            :disabled="!canRemoveUrl"
            :aria-label="`移除链接 ${index + 1}`"
            @click="removeUrl(index)"
          >
            <AppIcon icon="radix-icons:trash" class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button type="button" variant="outline" @click="addUrl">添加链接</Button>
    </div>

    <div>
      <Button type="button" @click="save">更新个人信息</Button>
    </div>
  </div>
</template>
