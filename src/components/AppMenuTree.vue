<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #rbac | Time: 2025-12-27T00:00:00+08:00
Principle: Menus are a projection of router data.
Taste: Render RouterVO tree with hidden filtering.
-->

<script setup lang="ts">
import type { RouterVO } from "@/schemas/auth"

import { computed } from "vue"
import { RouterLink, useRoute } from "vue-router"

import { Button } from "@/components/ui/button"

const props = withDefaults(
  defineProps<{
    items: RouterVO[]
    parentPath?: string
    level?: number
  }>(),
  {
    parentPath: "",
    level: 0,
  },
)

defineOptions({ name: "AppMenuTree" })

const route = useRoute()

function normalizePathSegment(path: string) {
  const trimmed = path.trim()
  if (!trimmed || trimmed === "/") return ""
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "")
}

function joinPath(parent: string, child: string) {
  const childTrimmed = child.trim()
  if (!childTrimmed) return parent || "/"

  if (/^https?:\/\//i.test(childTrimmed)) return childTrimmed
  if (childTrimmed.startsWith("/")) return childTrimmed

  const base = parent.replace(/\/+$/, "")
  const seg = normalizePathSegment(childTrimmed)
  return base ? `${base}/${seg}` : `/${seg}`
}

function paddingClass(level: number) {
  if (level <= 0) return "pl-2"
  if (level === 1) return "pl-4"
  if (level === 2) return "pl-6"
  return "pl-8"
}

const menuItems = computed(() =>
  props.items
    .filter((item) => item.hidden !== true)
    .map((item) => {
      const title = item.meta?.title ?? item.name ?? item.path
      const fullPath = joinPath(props.parentPath, item.path)
      const children = Array.isArray(item.children) ? item.children : []
      const externalLink = typeof item.meta?.link === "string" ? item.meta.link : null

      return {
        title: title.trim() || "未命名菜单",
        fullPath,
        externalLink,
        children,
      }
    }),
)

function isActive(targetPath: string) {
  const currentPath = route.path
  if (targetPath === "/") return currentPath === "/"
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
}
</script>

<template>
  <ul class="space-y-1">
    <li v-for="item in menuItems" :key="item.fullPath">
      <div v-if="item.children.length > 0" class="space-y-1">
        <div :class="['py-1 text-xs font-medium text-muted-foreground', paddingClass(level)]">
          {{ item.title }}
        </div>
        <AppMenuTree :items="item.children" :parent-path="item.fullPath" :level="level + 1" />
      </div>

      <div v-else>
        <Button
          v-if="item.externalLink"
          as-child
          variant="ghost"
          class="h-9 w-full justify-start"
          :class="[paddingClass(level), isActive(item.fullPath) ? 'bg-accent' : '']"
        >
          <a :href="item.externalLink" target="_blank" rel="noreferrer" class="w-full">
            {{ item.title }}
          </a>
        </Button>

        <Button
          v-else
          as-child
          variant="ghost"
          class="h-9 w-full justify-start"
          :class="[paddingClass(level), isActive(item.fullPath) ? 'bg-accent' : '']"
        >
          <RouterLink :to="item.fullPath" class="w-full">
            {{ item.title }}
          </RouterLink>
        </Button>
      </div>
    </li>
  </ul>
</template>
