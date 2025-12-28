// {{RIPER-10 Action}}
// Role: LD | Task_ID: #rbac | Time: 2025-12-27T00:00:00+08:00
// Principle: Button-level auth should be declarative.
// Taste: Hide unauthorized elements via v-permission / v-role.

import type { App, ObjectDirective } from "vue"

import { useUserStore } from "@/stores/user"

const detachedNodes = new WeakMap<HTMLElement, Comment>()

function hide(el: HTMLElement) {
  if (detachedNodes.has(el)) return
  const parent = el.parentNode
  if (!parent) return

  const placeholder = document.createComment("permission")
  el.before(placeholder)
  el.remove()
  detachedNodes.set(el, placeholder)
}

function show(el: HTMLElement) {
  const placeholder = detachedNodes.get(el)
  if (!placeholder) return

  const parent = placeholder.parentNode
  if (parent) {
    placeholder.before(el)
    placeholder.remove()
  }
  detachedNodes.delete(el)
}

function normalizeStringArray(value: unknown) {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string")
  return []
}

const permissionDirective: ObjectDirective<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const required = normalizeStringArray(binding.value)
      .map((p) => p.trim())
      .filter(Boolean)
    if (required.length === 0) return show(el)

    const userStore = useUserStore()
    if (userStore.hasAnyPermission(required)) return show(el)
    return hide(el)
  },
  beforeUnmount(el) {
    const placeholder = detachedNodes.get(el)
    if (placeholder?.parentNode) placeholder.remove()
    detachedNodes.delete(el)
  },
  updated(el, binding) {
    const required = normalizeStringArray(binding.value)
      .map((p) => p.trim())
      .filter(Boolean)
    if (required.length === 0) return show(el)

    const userStore = useUserStore()
    if (userStore.hasAnyPermission(required)) return show(el)
    return hide(el)
  },
}

const roleDirective: ObjectDirective<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const required = normalizeStringArray(binding.value)
      .map((r) => r.trim())
      .filter(Boolean)
    if (required.length === 0) return show(el)

    const userStore = useUserStore()
    if (userStore.hasAnyRole(required)) return show(el)
    return hide(el)
  },
  beforeUnmount(el) {
    const placeholder = detachedNodes.get(el)
    if (placeholder?.parentNode) placeholder.remove()
    detachedNodes.delete(el)
  },
  updated(el, binding) {
    const required = normalizeStringArray(binding.value)
      .map((r) => r.trim())
      .filter(Boolean)
    if (required.length === 0) return show(el)

    const userStore = useUserStore()
    if (userStore.hasAnyRole(required)) return show(el)
    return hide(el)
  },
}

export function registerPermissionDirectives(app: App) {
  app.directive("permission", permissionDirective)
  app.directive("role", roleDirective)
}
