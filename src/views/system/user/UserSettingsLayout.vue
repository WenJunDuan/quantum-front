<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #user-settings | Time: 2025-12-29T00:00:00+08:00
File: src/views/system/user/UserSettingsLayout.vue
Principle: Settings pages are content-first and predictable.
Taste: Apple-like hierarchy with a calm sidebar + clear form area.
-->

<script setup lang="ts">
import { computed } from "vue"
import { RouterLink, RouterView, useRoute } from "vue-router"

import AppIcon from "@/components/app-icon"
import { Separator } from "@/components/ui/separator"

interface NavItem {
  label: string
  description: string
  to: string
  icon: string
}

const route = useRoute()

const navItems: NavItem[] = [
  {
    label: "个人资料",
    description: "其他人将如何在站点上看到你。",
    to: "/user/profile",
    icon: "radix-icons:person",
  },
  {
    label: "账号",
    description: "管理账号设置与安全偏好。",
    to: "/user/account",
    icon: "radix-icons:lock-closed",
  },
]

function isActive(item: NavItem) {
  return route.path === item.to
}

const current = computed(() => navItems.find((item) => isActive(item)) ?? navItems[0]!)
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-3 py-4 sm:px-5 sm:py-6">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside class="lg:w-64">
        <nav class="grid gap-1" aria-label="User settings">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="group flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-[background,box-shadow,transform,color] hover:-translate-y-px hover:bg-accent hover:text-foreground hover:shadow-sm"
            :class="[
              isActive(item) ? 'bg-accent text-foreground shadow-sm' : 'text-muted-foreground',
            ]"
          >
            <AppIcon
              :icon="item.icon"
              class="h-4 w-4"
              :class="[isActive(item) ? 'text-primary' : 'text-muted-foreground']"
            />
            <span class="truncate">{{ item.label }}</span>
          </RouterLink>
        </nav>
      </aside>

      <section class="min-w-0 flex-1">
        <div class="px-1">
          <h1 class="text-2xl font-semibold tracking-tight">{{ current.label }}</h1>
          <p class="mt-1 text-[13px] text-muted-foreground">
            {{ current.description }}
          </p>
        </div>

        <Separator class="my-6 opacity-60" />

        <RouterView />
      </section>
    </div>
  </div>
</template>
