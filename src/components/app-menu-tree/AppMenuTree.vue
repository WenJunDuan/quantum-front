<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #rbac | Time: 2025-12-27T00:00:00+08:00
Principle: Menus are a projection of router data.
Taste: Render RouterVO tree with hidden filtering.
-->

<script setup lang="ts">
import type { RouterVO } from "@/schemas/auth"

import { computed } from "vue"
import { RouterLink, useRoute } from "vue-router"

import AppIcon from "@/components/app-icon"
import { Button } from "@/components/ui/button"

const props = withDefaults(
  defineProps<{
    items: RouterVO[]
    parentPath?: string
    level?: number
    collapsed?: boolean
  }>(),
  {
    parentPath: "",
    level: 0,
    collapsed: false,
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
  if (props.collapsed) return "px-0"
  if (level <= 0) return "pl-3"
  if (level === 1) return "pl-10"
  if (level === 2) return "pl-14"
  return "pl-16"
}

function resolveIcon(icon?: string) {
  const value = typeof icon === "string" ? icon.trim() : ""
  if (!value) return null
  if (value.includes(":")) return value
  return `radix-icons:${value}`
}

function resolveExternalLink(link?: string) {
  const value = typeof link === "string" ? link.trim() : ""
  if (!value) return null

  // Only treat absolute/schemed URLs as external links. Backend may also send `link` as a path segment.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith("//")) return value
  return null
}

const menuItems = computed(() =>
  props.items
    .filter((item) => item.hidden !== true)
    .map((item) => {
      const title = item.meta?.title ?? item.name ?? item.path
      const fullPath = joinPath(props.parentPath, item.path)
      const children = Array.isArray(item.children) ? item.children : []
      const icon = resolveIcon(item.meta?.icon)
      const externalLink = resolveExternalLink(item.meta?.link)

      return {
        title: title.trim() || "未命名菜单",
        fullPath,
        icon,
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
        <div
          v-if="!collapsed"
          :class="[
            'mt-4 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground/80',
            paddingClass(level),
          ]"
        >
          {{ item.title }}
        </div>
        <AppMenuTree
          :items="item.children"
          :parent-path="item.fullPath"
          :level="level + 1"
          :collapsed="collapsed"
        />
      </div>

      <div v-else>
        <Button
          v-if="item.externalLink"
          as-child
          variant="ghost"
          class="h-11 w-full rounded-lg text-[13px] font-medium"
          :class="[
            paddingClass(level),
            collapsed ? 'justify-center' : 'justify-start gap-3 pr-3',
            isActive(item.fullPath)
              ? 'bg-accent text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm',
          ]"
        >
          <a
            :href="item.externalLink"
            target="_blank"
            rel="noreferrer"
            :title="collapsed ? item.title : undefined"
            class="flex w-full items-center"
            :class="[collapsed ? 'justify-center' : 'gap-3']"
          >
            <AppIcon
              v-if="item.icon"
              :icon="item.icon"
              class="h-4 w-4"
              :class="[isActive(item.fullPath) ? 'text-primary' : 'text-muted-foreground']"
            />
            <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
            <span v-else class="sr-only">{{ item.title }}</span>
          </a>
        </Button>

        <Button
          v-else
          as-child
          variant="ghost"
          class="h-11 w-full rounded-lg text-[13px] font-medium"
          :class="[
            paddingClass(level),
            collapsed ? 'justify-center' : 'justify-start gap-3 pr-3',
            isActive(item.fullPath)
              ? 'bg-accent text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm',
          ]"
        >
          <RouterLink
            :to="item.fullPath"
            :title="collapsed ? item.title : undefined"
            class="flex w-full items-center"
            :class="[collapsed ? 'justify-center' : 'gap-3']"
          >
            <AppIcon
              v-if="item.icon"
              :icon="item.icon"
              class="h-4 w-4"
              :class="[isActive(item.fullPath) ? 'text-primary' : 'text-muted-foreground']"
            />
            <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
            <span v-else class="sr-only">{{ item.title }}</span>
          </RouterLink>
        </Button>
      </div>
    </li>
  </ul>
</template>
