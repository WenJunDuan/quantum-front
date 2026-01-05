<!--
  AppMenuTree 组件 - shadcn-vue 官方规范
  
  修改点：
  - 菜单项高度: h-11 → h-9
  - 字体: text-[13px] → text-sm
  - 分组标题: text-[11px] → text-xs
  - 激活态: 移除 shadow-sm
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
  if (level <= 0) return "pl-2"
  if (level === 1) return "pl-6"
  if (level === 2) return "pl-10"
  return "pl-12"
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
      <!-- 有子菜单的分组 -->
      <div v-if="item.children.length > 0" class="space-y-1">
        <div
          v-if="!collapsed"
          :class="[
            'mt-3 px-2 py-1.5 text-xs font-medium text-muted-foreground',
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

      <!-- 外部链接 -->
      <div v-else-if="item.externalLink">
        <Button
          as-child
          variant="ghost"
          class="h-9 w-full justify-start text-sm"
          :class="[
            paddingClass(level),
            collapsed ? 'justify-center' : 'gap-2',
            isActive(item.fullPath)
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground',
          ]"
        >
          <a
            :href="item.externalLink"
            target="_blank"
            rel="noreferrer"
            :title="collapsed ? item.title : undefined"
            class="flex w-full items-center"
            :class="[collapsed ? 'justify-center' : 'gap-2']"
          >
            <AppIcon
              v-if="item.icon"
              :icon="item.icon"
              class="h-4 w-4"
              :class="[isActive(item.fullPath) ? 'text-foreground' : 'text-muted-foreground']"
            />
            <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
            <span v-else class="sr-only">{{ item.title }}</span>
          </a>
        </Button>
      </div>

      <!-- 内部链接 -->
      <div v-else>
        <Button
          as-child
          variant="ghost"
          class="h-9 w-full justify-start text-sm"
          :class="[
            paddingClass(level),
            collapsed ? 'justify-center' : 'gap-2',
            isActive(item.fullPath)
              ? 'bg-muted font-medium text-foreground'
              : 'text-muted-foreground',
          ]"
        >
          <RouterLink
            :to="item.fullPath"
            :title="collapsed ? item.title : undefined"
            class="flex w-full items-center"
            :class="[collapsed ? 'justify-center' : 'gap-2']"
          >
            <AppIcon
              v-if="item.icon"
              :icon="item.icon"
              class="h-4 w-4"
              :class="[isActive(item.fullPath) ? 'text-foreground' : 'text-muted-foreground']"
            />
            <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
            <span v-else class="sr-only">{{ item.title }}</span>
          </RouterLink>
        </Button>
      </div>
    </li>
  </ul>
</template>
