// {{RIPER-10 Action}}
// Role: LD | Task_ID: #fix-dynamic | Time: 2025-12-27T00:00:00+08:00
// Principle: Router records are data; backend drives visibility.
// Taste: Build route records from RouterVO with safe fallbacks.

import type { RouterVO } from "@/schemas/auth"
import type { RouteRecordName, RouteRecordRaw, Router } from "vue-router"

import { RouterView } from "vue-router"

type ViewLoader = () => Promise<unknown>

const viewModules = import.meta.glob("../views/**/*.vue") as Record<string, ViewLoader>

interface ViewModuleEntry {
  loader: ViewLoader
  file: string
}

function normalizeViewModuleKey(path: string) {
  return path
    .replaceAll("\\", "/")
    .replace(/^\.\.\/views\//, "")
    .replace(/\.vue$/i, "")
    .toLowerCase()
}

const viewModuleMap = new Map<string, ViewModuleEntry>()
for (const [path, loader] of Object.entries(viewModules)) {
  const normalized = normalizeViewModuleKey(path)
  const existing = viewModuleMap.get(normalized)
  if (existing && existing.file !== path) {
    throw new Error(
      `[DynamicRoutes] Duplicate view module key "${normalized}": "${existing.file}" and "${path}".`,
    )
  }
  viewModuleMap.set(normalized, { loader, file: path })
}

const dynamicRouteNames = new Set<RouteRecordName>()

function normalizePathSegment(path: string) {
  const trimmed = path.trim()
  if (!trimmed || trimmed === "/") return ""
  return trimmed.replace(/^\/+/, "").replace(/\/+$/, "")
}

function joinFullPath(parentFullPath: string, segment: string) {
  const parent = parentFullPath.trim().replace(/\/+$/, "")
  const seg = segment.trim().replace(/^\/+/, "")

  if (!parent) return seg ? `/${seg}` : "/"
  if (!seg) return parent.startsWith("/") ? parent : `/${parent}`
  return `${parent.startsWith("/") ? parent : `/${parent}`}/${seg}`
}

function hasNonAscii(input: string): boolean {
  for (const char of input) {
    const code = char.codePointAt(0)
    if (code !== undefined && code > 0x7f) return true
  }
  return false
}

/**
 * 生成安全的路由名称 slug
 * 支持中文字符，使用 URL 编码处理
 */
function toSafeSlug(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return "menu"

  // 移除特殊字符，保留中文、英文、数字、连字符
  const cleaned = trimmed
    .replaceAll(/[\s/\\:*?"<>|]+/g, "-") // 空格和特殊字符替换为连字符
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    .replaceAll(/-+/g, "-") // 多个连字符合并

  if (!cleaned) return "menu"

  // 如果包含非 ASCII 字符（如中文），进行编码
  if (hasNonAscii(cleaned)) {
    return encodeURIComponent(cleaned)
  }

  return cleaned.toLowerCase()
}

function uniqueName(base: string, used: Set<string>) {
  const safeBase = base.trim() || "menu"
  if (!used.has(safeBase)) {
    used.add(safeBase)
    return safeBase
  }

  for (let i = 2; i < 10_000; i += 1) {
    const next = `${safeBase}-${i}`
    if (!used.has(next)) {
      used.add(next)
      return next
    }
  }

  const fallback = `${safeBase}-${Date.now()}`
  used.add(fallback)
  return fallback
}

function normalizeComponentKey(component: string) {
  return component
    .trim()
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\.vue$/i, "")
    .toLowerCase()
}

function resolveViewLoader(component?: string) {
  if (!component) return null

  const key = normalizeComponentKey(component)
  if (!key) return null

  // 跳过布局组件
  if (key === "layout" || key === "parentview" || key === "routerview") return null

  const direct = viewModuleMap.get(key)?.loader
  if (direct) return direct

  const index = viewModuleMap.get(`${key}/index`)?.loader
  if (index) return index

  return null
}

function toRouteRecord(
  item: RouterVO,
  parentFullPath: string,
  usedNames: Set<string>,
  index: number,
): RouteRecordRaw {
  const segment = normalizePathSegment(item.path)
  const fullPath = joinFullPath(parentFullPath, segment)

  const title = item.meta?.title ?? item.name ?? item.path
  const nameBase = item.name?.trim()
    ? `menu-${toSafeSlug(item.name)}`
    : `menu-${toSafeSlug(fullPath)}`

  const name = uniqueName(nameBase, usedNames)

  const children = Array.isArray(item.children) ? item.children : []
  const resolvedLoader = resolveViewLoader(item.component)

  const component: RouteRecordRaw["component"] =
    resolvedLoader ??
    (children.length > 0 ? RouterView : () => import("@/views/error/Error404.vue"))

  return {
    name,
    path: segment || (index === 0 && parentFullPath === "" ? "" : segment),
    redirect: item.redirect,
    component,
    meta: {
      title: title ?? (item.name?.trim() || undefined),
      icon: item.meta?.icon,
      hidden: item.hidden,
      link: item.meta?.link,
      noCache: item.meta?.noCache,
      permission: item.meta?.permission,
      roles: item.meta?.roles,
      requiresAuth: item.meta?.requiresAuth ?? true,
      query: item.query,
      alwaysShow: item.alwaysShow,
      fullPath,
    },
    children:
      children.length > 0
        ? children.map((child, childIndex) => toRouteRecord(child, fullPath, usedNames, childIndex))
        : undefined,
  }
}

function collectRouteNames(route: RouteRecordRaw, names: Set<RouteRecordName>) {
  if (route.name) names.add(route.name)
  if (route.children) {
    for (const child of route.children) collectRouteNames(child, names)
  }
}

export function buildRoutesFromRouters(routers: RouterVO[]): RouteRecordRaw[] {
  const usedNames = new Set<string>()
  return routers.map((item, index) => toRouteRecord(item, "", usedNames, index))
}

export function registerDynamicRoutes(
  router: Router,
  parentName: RouteRecordName,
  routers: RouterVO[],
) {
  const routes = buildRoutesFromRouters(routers)
  for (const route of routes) {
    router.addRoute(parentName, route)
    collectRouteNames(route, dynamicRouteNames)
  }
}

export function resetDynamicRoutes(router: Router) {
  for (const name of dynamicRouteNames) {
    router.removeRoute(name)
  }
  dynamicRouteNames.clear()
}
