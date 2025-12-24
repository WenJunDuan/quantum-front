<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Keep app shell simple; route content drives complexity.
Taste: A minimal layout + theme toggle without framework lock-in.
-->

<script setup lang="ts">
import { computed } from "vue"
import { RouterLink, RouterView, useRoute } from "vue-router"

import AppIcon from "@/components/AppIcon.vue"
import { Button } from "@/components/ui/button"
import { useAppColorMode } from "@/composables/useAppColorMode"
import { appConfig } from "@/config/app"
import { cn } from "@/lib/utils"

const route = useRoute()
const { isDark, toggle } = useAppColorMode()

const navItems = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
] as const

const themeIcon = computed(() => {
  if (isDark.value) return "hugeicons:sun-01"
  return "hugeicons:moon"
})

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <div class="min-h-dvh bg-background text-foreground">
    <header class="border-b bg-background/80 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 p-4">
        <div class="flex items-center gap-4">
          <RouterLink class="font-semibold tracking-tight" to="/">
            {{ appConfig.title }}
          </RouterLink>

          <nav class="hidden items-center gap-1 sm:flex">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              :class="
                cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive(item.to) && 'bg-accent text-accent-foreground',
                )
              "
            >
              {{ item.label }}
            </RouterLink>
          </nav>
        </div>

        <Button size="icon" variant="outline" aria-label="Toggle theme" @click="toggle()">
          <AppIcon :icon="themeIcon" class="size-4" />
        </Button>
      </div>
    </header>

    <RouterView />
  </div>
</template>
