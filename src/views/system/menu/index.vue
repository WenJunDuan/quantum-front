<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #system-menu-page | Time: 2026-01-02T00:00:00+08:00
Principle: Menu management is data-first: select → edit → save.
Taste: Two-panel layout with a simple tree and a clear form.
-->

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"

import AppIcon from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  useCreateMenuMutation,
  useDeleteMenuMutation,
  useMenuDetailQuery,
  useMenuTreeQuery,
  useUpdateMenuMutation,
} from "@/queries/system/menu"
import {
  MenuCreateRequestSchema,
  MenuUpdateRequestSchema,
  type MenuCreateRequest,
  type MenuQuery,
  type MenuUpdateRequest,
  type MenuVO,
} from "@/schemas/system/menu"
import { useNotifyStore } from "@/stores/notify"

type PageMode = "create" | "edit"

interface FlatMenuItem {
  id: number
  label: string
  level: number
  node: MenuVO
}

interface MenuTreeItem {
  id: number
  label: string
  node: MenuVO
  children: MenuTreeItem[]
}

interface MenuTreeRow {
  id: number
  label: string
  level: number
  node: MenuVO
  hasChildren: boolean
  isExpanded: boolean
}

const notify = useNotifyStore()

const statusFilter = ref<"" | "1" | "0">("")
const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "启用", value: "1" },
  { label: "停用", value: "0" },
]

const menuQuery = computed<MenuQuery>(() => {
  const status = statusFilter.value === "" ? undefined : Number(statusFilter.value)
  return typeof status === "number" ? { status } : {}
})

const treeQuery = useMenuTreeQuery(menuQuery)
const treeNodes = computed(() => treeQuery.data.value ?? [])
const isTreeLoading = computed(() => treeQuery.isFetching.value)

const selectedMenuId = ref<number | null>(null)
const detailQuery = useMenuDetailQuery(selectedMenuId)
const selectedMenu = computed(() => detailQuery.data.value ?? null)
const isDetailLoading = computed(() => detailQuery.isFetching.value)

const mode = ref<PageMode>("create")
const treeFilter = ref("")

watch(statusFilter, () => {
  startCreateRoot()
})

const DEFAULT_ICON = "radix-icons:dot-filled"

function normalizeMenuType(menuType?: string) {
  return (menuType ?? "").trim().toUpperCase()
}

function isButtonMenu(node: MenuVO) {
  return normalizeMenuType(node.menuType) === "F"
}

function menuTypeLabel(menuType?: string) {
  const normalized = normalizeMenuType(menuType)
  if (normalized === "M") return "目录"
  if (normalized === "C") return "菜单"
  if (normalized === "F") return "按钮"
  return "未知"
}

function menuTypeBadgeClass(menuType?: string) {
  const normalized = normalizeMenuType(menuType)
  if (normalized === "M") return "bg-blue-100 text-blue-700"
  if (normalized === "C") return "bg-green-100 text-green-700"
  if (normalized === "F") return "bg-orange-100 text-orange-700"
  return "bg-muted text-muted-foreground"
}

function resolveIcon(icon?: string) {
  const value = typeof icon === "string" ? icon.trim() : ""
  if (!value) return DEFAULT_ICON
  if (value.includes(":")) return value
  return `radix-icons:${value}`
}

function getMenuLabel(node: MenuVO, fallbackId: number) {
  return (node.menuName ?? "").trim() || (node.path ?? "").trim() || `#${fallbackId}`
}

function flattenMenuTree(nodes: MenuVO[], level = 0, out: FlatMenuItem[] = []) {
  for (const node of nodes) {
    if (isButtonMenu(node)) continue
    const id = node.id
    if (typeof id === "number" && Number.isInteger(id) && id > 0) {
      const label = getMenuLabel(node, id)
      out.push({ id, label, level, node })
    }

    const children = Array.isArray(node.children) ? node.children : []
    if (children.length > 0) flattenMenuTree(children, level + 1, out)
  }
  return out
}

const flatTree = computed(() => flattenMenuTree(treeNodes.value))

function findMenuNodeById(nodes: MenuVO[], menuId: number): MenuVO | null {
  for (const node of nodes) {
    if (node.id === menuId) return node
    const children = Array.isArray(node.children) ? node.children : []
    const found = children.length > 0 ? findMenuNodeById(children, menuId) : null
    if (found) return found
  }
  return null
}

function collectMenuDescendantIds(node: MenuVO, ids: Set<number>) {
  const children = Array.isArray(node.children) ? node.children : []
  for (const child of children) {
    const id = child.id
    if (typeof id === "number" && Number.isInteger(id) && id > 0) {
      ids.add(id)
      collectMenuDescendantIds(child, ids)
    }
  }
}

const excludedParentIds = computed(() => {
  if (mode.value !== "edit") return new Set<number>()
  const id = selectedMenuId.value
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) return new Set<number>()

  const target = findMenuNodeById(treeNodes.value, id)
  const ids = new Set<number>([id])
  if (target) collectMenuDescendantIds(target, ids)
  return ids
})

const parentOptions = computed(() => {
  const excluded = excludedParentIds.value
  const options =
    excluded.size > 0 ? flatTree.value.filter((item) => !excluded.has(item.id)) : flatTree.value
  return [{ id: 0, label: "根目录", level: 0 }, ...options]
})

const parentSelectOptions = computed(() =>
  parentOptions.value.map((opt) => ({
    label: opt.id === 0 ? "顶级菜单" : opt.label,
    value: String(opt.id),
  })),
)

function buildMenuTree(nodes: MenuVO[]): MenuTreeItem[] {
  const items: MenuTreeItem[] = []

  for (const node of nodes) {
    if (isButtonMenu(node)) continue

    const id = node.id
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) continue

    const children = Array.isArray(node.children) ? node.children : []
    items.push({
      id,
      label: getMenuLabel(node, id),
      node,
      children: buildMenuTree(children),
    })
  }

  return items
}

function filterMenuTree(items: MenuTreeItem[], keyword: string): MenuTreeItem[] {
  if (!keyword) return items

  const output: MenuTreeItem[] = []
  for (const item of items) {
    const children = filterMenuTree(item.children, keyword)
    const hit = item.label.toLowerCase().includes(keyword)
    if (hit || children.length > 0) output.push({ ...item, children })
  }
  return output
}

function collectExpandableIds(items: MenuTreeItem[], expandableIds: number[]) {
  for (const item of items) {
    if (item.children.length > 0) {
      expandableIds.push(item.id)
      collectExpandableIds(item.children, expandableIds)
    }
  }
}

const menuTree = computed(() => buildMenuTree(treeNodes.value))
const treeKeyword = computed(() => treeFilter.value.trim().toLowerCase())

const expandableMenuIds = computed(() => {
  const expandableIds: number[] = []
  collectExpandableIds(menuTree.value, expandableIds)
  return expandableIds
})

const expandedMenuIds = reactive(new Set<number>())
watch(
  () => expandableMenuIds.value,
  (ids) => {
    if (expandedMenuIds.size > 0) return
    for (const id of ids) expandedMenuIds.add(id)
  },
  { immediate: true },
)

function expandAllMenus() {
  for (const id of expandableMenuIds.value) expandedMenuIds.add(id)
}

function collapseAllMenus() {
  expandedMenuIds.clear()
}

function toggleMenuExpanded(menuId: number) {
  if (expandedMenuIds.has(menuId)) expandedMenuIds.delete(menuId)
  else expandedMenuIds.add(menuId)
}

const filteredMenuTree = computed(() => filterMenuTree(menuTree.value, treeKeyword.value))

const treeRows = computed<MenuTreeRow[]>(() => {
  const rows: MenuTreeRow[] = []
  const forceExpand = Boolean(treeKeyword.value)

  const walk = (items: MenuTreeItem[], level: number) => {
    for (const item of items) {
      const hasChildren = item.children.length > 0
      const isExpanded = forceExpand || expandedMenuIds.has(item.id)

      rows.push({
        id: item.id,
        label: item.label,
        level,
        node: item.node,
        hasChildren,
        isExpanded,
      })

      if (hasChildren && isExpanded) walk(item.children, level + 1)
    }
  }

  walk(filteredMenuTree.value, 0)
  return rows
})

const selectedTreeNode = computed(() => {
  const id = selectedMenuId.value
  if (!id) return null
  return findMenuNodeById(treeNodes.value, id)
})

const selectedButtonNodes = computed(() => {
  const node = selectedTreeNode.value
  if (!node) return []
  const children = Array.isArray(node.children) ? node.children : []
  return children.filter((child) => isButtonMenu(child))
})

const fieldClass =
  "flex h-10 w-full rounded-lg border border-input bg-background/55 px-4 py-2 text-[13px] shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 supports-[backdrop-filter]:bg-background/45"

const textareaClass =
  "flex min-h-[96px] w-full rounded-lg border border-input bg-background/55 px-4 py-3 text-[13px] shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 supports-[backdrop-filter]:bg-background/45"

interface MenuFormState {
  id: string
  parentId: string
  menuName: string
  orderNum: string
  path: string
  component: string
  queryParam: string
  isFrame: string
  isCache: string
  menuType: string
  visible: string
  perms: string
  icon: string
  status: string
  remark: string
}

function createDefaultForm(): MenuFormState {
  return {
    id: "",
    parentId: "0",
    menuName: "",
    orderNum: "",
    path: "",
    component: "",
    queryParam: "",
    isFrame: "0",
    isCache: "0",
    menuType: "C",
    visible: "0",
    perms: "",
    icon: "",
    status: "1",
    remark: "",
  }
}

const form = reactive<MenuFormState>(createDefaultForm())

function resetForm(next?: Partial<MenuFormState>) {
  Object.assign(form, createDefaultForm(), next ?? {})
}

function applyMenuToForm(menu: MenuVO) {
  resetForm({
    id: typeof menu.id === "number" ? String(menu.id) : "",
    parentId: typeof menu.parentId === "number" ? String(menu.parentId) : "0",
    menuName: menu.menuName ?? "",
    orderNum: typeof menu.orderNum === "number" ? String(menu.orderNum) : "",
    path: menu.path ?? "",
    component: menu.component ?? "",
    queryParam: menu.queryParam ?? "",
    isFrame: typeof menu.isFrame === "number" ? String(menu.isFrame) : "0",
    isCache: typeof menu.isCache === "number" ? String(menu.isCache) : "0",
    menuType: (menu.menuType ?? "").trim() || "C",
    visible: typeof menu.visible === "number" ? String(menu.visible) : "0",
    perms: menu.perms ?? "",
    icon: menu.icon ?? "",
    status: typeof menu.status === "number" ? String(menu.status) : "1",
    remark: menu.remark ?? "",
  })
}

watch(
  selectedMenu,
  (next) => {
    if (!next) return
    if (mode.value !== "edit") return
    applyMenuToForm(next)
  },
  { immediate: true },
)

const detailHeaderType = computed(() => {
  if (mode.value === "edit") return selectedMenu.value?.menuType ?? selectedTreeNode.value?.menuType
  return form.menuType
})

const detailHeaderTitle = computed(() => {
  if (mode.value === "edit") {
    const menu = selectedMenu.value ?? selectedTreeNode.value
    const id = typeof menu?.id === "number" ? menu.id : (selectedMenuId.value ?? 0)
    if (menu && id) return getMenuLabel(menu, id)
    return "菜单详情"
  }

  const kind = menuTypeLabel(form.menuType)
  return `新增${kind === "未知" ? "菜单" : kind}`
})

const detailHeaderTypeLabel = computed(() => menuTypeLabel(detailHeaderType.value))
const detailHeaderTypeBadgeClass = computed(() => menuTypeBadgeClass(detailHeaderType.value))

const canManageButtons = computed(() => normalizeMenuType(selectedTreeNode.value?.menuType) === "C")

function toOptionalInt(input: string): number | undefined {
  const trimmed = input.trim()
  if (!trimmed) return undefined
  const value = Number(trimmed)
  if (!Number.isFinite(value)) return undefined
  return Math.trunc(value)
}

function toOptionalText(input: string): string | undefined {
  const trimmed = input.trim()
  return trimmed || undefined
}

function refreshTree() {
  void treeQuery.refetch()
}

function selectMenu(menuId: number) {
  mode.value = "edit"
  selectedMenuId.value = menuId
}

function startCreateRoot() {
  mode.value = "create"
  selectedMenuId.value = null
  resetForm({ parentId: "0", menuType: "M" })
}

function startCreateChild() {
  if (!selectedMenuId.value) {
    notify.info("请先在左侧选择一个父菜单")
    return
  }

  mode.value = "create"
  resetForm({ parentId: String(selectedMenuId.value), menuType: "C" })
}

function startCreateButton() {
  if (!selectedMenuId.value) {
    notify.info("请先在左侧选择一个菜单")
    return
  }

  mode.value = "create"
  resetForm({ parentId: String(selectedMenuId.value), menuType: "F" })
}

function incrementOrder(step = 1) {
  const current = toOptionalInt(form.orderNum) ?? 0
  const next = Math.max(0, current + step)
  form.orderNum = String(next)
}

const createMutation = useCreateMenuMutation()
const updateMutation = useUpdateMenuMutation()
const deleteMutation = useDeleteMenuMutation()

const isSaving = computed(() => createMutation.isPending.value || updateMutation.isPending.value)

function buildCreatePayload(): MenuCreateRequest {
  const payload = {
    parentId: toOptionalInt(form.parentId),
    menuName: form.menuName.trim(),
    orderNum: toOptionalInt(form.orderNum),
    path: toOptionalText(form.path),
    component: toOptionalText(form.component),
    queryParam: toOptionalText(form.queryParam),
    isFrame: toOptionalInt(form.isFrame),
    isCache: toOptionalInt(form.isCache),
    menuType: form.menuType.trim(),
    visible: toOptionalInt(form.visible),
    perms: toOptionalText(form.perms),
    icon: toOptionalText(form.icon),
    status: toOptionalInt(form.status),
    remark: toOptionalText(form.remark),
  }

  return MenuCreateRequestSchema.parse(payload)
}

function buildUpdatePayload(): MenuUpdateRequest {
  const base = buildCreatePayload()
  const id = toOptionalInt(form.id)
  if (!id) throw new Error("[SystemMenu] menuId is required for update")
  return MenuUpdateRequestSchema.parse({ ...base, id })
}

async function onSave() {
  if (isSaving.value) return

  if (!form.menuName.trim()) {
    notify.error("菜单名称不能为空")
    return
  }
  if (!form.menuType.trim()) {
    notify.error("菜单类型不能为空")
    return
  }

  try {
    if (mode.value === "create") {
      const id = await createMutation.mutateAsync(buildCreatePayload())
      notify.success("菜单已创建")
      mode.value = "edit"
      selectedMenuId.value = id
      await treeQuery.refetch()
      return
    }

    await updateMutation.mutateAsync(buildUpdatePayload())
    notify.success("菜单已保存")
  } catch (error) {
    if (error instanceof Error && error.message.includes("[SystemMenu]")) {
      notify.error(error.message.replace("[SystemMenu] ", ""))
      return
    }
    // others are handled globally by request/notify
  }
}

function onReset() {
  if (mode.value === "edit" && selectedMenu.value) {
    applyMenuToForm(selectedMenu.value)
    return
  }
  startCreateRoot()
}

async function onDelete() {
  if (mode.value !== "edit") return

  const menuId = toOptionalInt(form.id)
  if (!menuId) return

  await deleteMenuNode(menuId)
}

async function deleteMenuNode(menuId: number) {
  if (deleteMutation.isPending.value) return

  if (!globalThis.confirm("确认删除该菜单？（如存在子菜单，请先处理）")) return

  try {
    await deleteMutation.mutateAsync(menuId)
    notify.success("菜单已删除")

    if (selectedMenuId.value === menuId) {
      selectedMenuId.value = null
      startCreateRoot()
    }

    await treeQuery.refetch()
  } catch {
    // errors are handled globally by request/notify
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">菜单管理</h1>
      <p class="text-[13px] text-muted-foreground">配置系统菜单、按钮权限标识</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card class="overflow-hidden">
        <CardHeader
          class="flex flex-col gap-3 bg-muted/30 !p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <CardTitle class="text-base">菜单列表</CardTitle>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="isTreeLoading"
              @click="refreshTree"
            >
              刷新
            </Button>
            <Button type="button" size="sm" :disabled="isTreeLoading" @click="startCreateRoot">
              + 新增
            </Button>
          </div>
        </CardHeader>

        <CardContent class="grid gap-3 !p-4">
          <div class="flex flex-wrap items-center gap-2">
            <div class="min-w-[200px] flex-1">
              <Input v-model="treeFilter" placeholder="搜索菜单名称..." />
            </div>
            <div class="w-full sm:w-[160px]">
              <Select v-model="statusFilter" :options="statusOptions" />
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" @click="expandAllMenus">
              展开全部
            </Button>
            <Button type="button" variant="outline" size="sm" @click="collapseAllMenus">
              收起全部
            </Button>
          </div>
        </CardContent>

        <CardContent
          class="max-h-[70dvh] overflow-auto p-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div v-if="isTreeLoading" class="p-3 text-sm text-muted-foreground">加载中...</div>
          <div v-else-if="treeRows.length === 0" class="p-3 text-sm text-muted-foreground">
            暂无数据
          </div>
          <ul v-else class="space-y-1">
            <li v-for="row in treeRows" :key="row.id">
              <div
                role="button"
                tabindex="0"
                class="group flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] font-medium transition-[background,box-shadow,transform] hover:-translate-y-px"
                :class="[
                  selectedMenuId === row.id
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm',
                ]"
                :style="{ paddingLeft: `${row.level * 16}px` }"
                @click="selectMenu(row.id)"
                @keydown.enter.prevent="selectMenu(row.id)"
                @keydown.space.prevent="selectMenu(row.id)"
              >
                <button
                  v-if="row.hasChildren"
                  type="button"
                  class="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  :aria-label="row.isExpanded ? '收起' : '展开'"
                  @click.stop="toggleMenuExpanded(row.id)"
                >
                  <AppIcon
                    icon="radix-icons:chevron-down"
                    class="h-4 w-4 transition-transform duration-200"
                    :class="[row.isExpanded ? 'rotate-0' : '-rotate-90']"
                  />
                </button>
                <span v-else class="inline-block size-7" />

                <div
                  class="grid size-7 place-items-center rounded-md bg-muted/60 text-muted-foreground"
                >
                  <AppIcon :icon="resolveIcon(row.node.icon)" class="h-4 w-4" />
                </div>

                <span class="min-w-0 flex-1 truncate">{{ row.label }}</span>

                <span
                  class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :class="menuTypeBadgeClass(row.node.menuType)"
                >
                  {{ menuTypeLabel(row.node.menuType) }}
                </span>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card class="overflow-hidden">
        <form class="grid gap-0" @submit.prevent="onSave">
          <CardHeader
            class="flex flex-col gap-3 bg-muted/30 !p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex flex-wrap items-center gap-2">
              <CardTitle class="text-base">{{ detailHeaderTitle }}</CardTitle>
              <span
                class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                :class="detailHeaderTypeBadgeClass"
              >
                {{ detailHeaderTypeLabel }}
              </span>
              <span
                v-if="mode === 'edit' && isDetailLoading"
                class="text-[12px] text-muted-foreground"
              >
                加载中...
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                :disabled="!selectedMenuId"
                @click="startCreateChild"
              >
                新增子级
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                :disabled="mode !== 'edit' || deleteMutation.isPending.value"
                @click="onDelete"
              >
                删除
              </Button>
              <Button type="submit" size="sm" :disabled="isSaving">
                {{ isSaving ? "保存中..." : "保存" }}
              </Button>
            </div>
          </CardHeader>

          <div class="h-px w-full bg-border" />

          <CardContent class="grid gap-6 !p-4">
            <div class="grid gap-4 lg:grid-cols-2">
              <div class="grid gap-2">
                <Label for="menu-parentId">上级菜单</Label>
                <Select id="menu-parentId" v-model="form.parentId" :options="parentSelectOptions" />
              </div>

              <div class="grid gap-2">
                <div class="flex items-center gap-1">
                  <Label>菜单类型</Label>
                  <span class="text-destructive">*</span>
                </div>
                <div class="flex flex-wrap gap-4">
                  <label class="inline-flex items-center gap-2 text-[13px]">
                    <input
                      v-model="form.menuType"
                      type="radio"
                      value="M"
                      class="h-4 w-4 accent-primary"
                    />
                    目录
                  </label>
                  <label class="inline-flex items-center gap-2 text-[13px]">
                    <input
                      v-model="form.menuType"
                      type="radio"
                      value="C"
                      class="h-4 w-4 accent-primary"
                    />
                    菜单
                  </label>
                  <label class="inline-flex items-center gap-2 text-[13px]">
                    <input
                      v-model="form.menuType"
                      type="radio"
                      value="F"
                      class="h-4 w-4 accent-primary"
                    />
                    按钮
                  </label>
                </div>
              </div>

              <div class="grid gap-2">
                <div class="flex items-center gap-1">
                  <Label for="menu-name">菜单名称</Label>
                  <span class="text-destructive">*</span>
                </div>
                <Input id="menu-name" v-model="form.menuName" placeholder="例如：用户管理" />
              </div>

              <div class="grid gap-2">
                <Label for="menu-icon">菜单图标</Label>
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <Input id="menu-icon" v-model="form.icon" placeholder="例如：user" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    @click="notify.info('暂未实现图标选择器')"
                  >
                    选择
                  </Button>
                </div>
              </div>

              <div class="grid gap-2">
                <div class="flex items-center gap-1">
                  <Label for="menu-path">路由地址</Label>
                  <span class="text-destructive">*</span>
                </div>
                <Input id="menu-path" v-model="form.path" placeholder="例如：user" />
              </div>

              <div class="grid gap-2">
                <Label for="menu-component">组件路径</Label>
                <Input
                  id="menu-component"
                  v-model="form.component"
                  placeholder="例如：system/user/index"
                />
              </div>

              <div class="grid gap-2">
                <Label for="menu-perms">权限标识</Label>
                <Input id="menu-perms" v-model="form.perms" placeholder="例如：system:user:list" />
              </div>

              <div class="grid gap-2">
                <div class="flex items-center gap-1">
                  <Label for="menu-orderNum">显示排序</Label>
                  <span class="text-destructive">*</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    id="menu-orderNum"
                    v-model="form.orderNum"
                    inputmode="numeric"
                    :class="[fieldClass, 'flex-1']"
                  />
                  <Button type="button" variant="outline" size="icon" @click="incrementOrder(1)">
                    +
                  </Button>
                </div>
              </div>
            </div>

            <div class="rounded-lg bg-muted/30 p-4">
              <div class="mb-3 text-[13px] font-semibold tracking-tight">高级配置</div>

              <div class="grid gap-4 lg:grid-cols-3">
                <div class="grid gap-2">
                  <Label>是否外链</Label>
                  <div class="flex flex-wrap gap-4">
                    <label class="inline-flex items-center gap-2 text-[13px]">
                      <input
                        v-model="form.isFrame"
                        type="radio"
                        value="0"
                        class="h-4 w-4 accent-primary"
                      />
                      否
                    </label>
                    <label class="inline-flex items-center gap-2 text-[13px]">
                      <input
                        v-model="form.isFrame"
                        type="radio"
                        value="1"
                        class="h-4 w-4 accent-primary"
                      />
                      是
                    </label>
                  </div>
                </div>

                <div class="grid gap-2">
                  <Label>是否缓存</Label>
                  <div class="flex flex-wrap gap-4">
                    <label class="inline-flex items-center gap-2 text-[13px]">
                      <input
                        v-model="form.isCache"
                        type="radio"
                        value="0"
                        class="h-4 w-4 accent-primary"
                      />
                      缓存
                    </label>
                    <label class="inline-flex items-center gap-2 text-[13px]">
                      <input
                        v-model="form.isCache"
                        type="radio"
                        value="1"
                        class="h-4 w-4 accent-primary"
                      />
                      不缓存
                    </label>
                  </div>
                </div>

                <div class="grid gap-2">
                  <Label>是否可见</Label>
                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      :class="[form.visible === '0' ? 'bg-primary' : 'bg-muted']"
                      @click="form.visible = form.visible === '0' ? '1' : '0'"
                    >
                      <span
                        class="inline-block size-5 rounded-full bg-background shadow transition-transform"
                        :class="[form.visible === '0' ? 'translate-x-5' : 'translate-x-1']"
                      />
                    </button>
                    <span class="text-[13px] text-muted-foreground">
                      {{ form.visible === "0" ? "显示" : "隐藏" }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="mt-4 grid gap-4 lg:grid-cols-2">
                <div class="grid gap-2">
                  <Label>菜单状态</Label>
                  <div class="flex flex-wrap gap-4">
                    <label class="inline-flex items-center gap-2 text-[13px]">
                      <input
                        v-model="form.status"
                        type="radio"
                        value="1"
                        class="h-4 w-4 accent-primary"
                      />
                      启用
                    </label>
                    <label class="inline-flex items-center gap-2 text-[13px]">
                      <input
                        v-model="form.status"
                        type="radio"
                        value="0"
                        class="h-4 w-4 accent-primary"
                      />
                      停用
                    </label>
                  </div>
                </div>

                <div class="grid gap-2">
                  <Label for="menu-queryParam">路由参数</Label>
                  <Input
                    id="menu-queryParam"
                    v-model="form.queryParam"
                    placeholder='例如：{"id":1}'
                  />
                </div>
              </div>
            </div>

            <div v-if="canManageButtons" class="grid gap-3">
              <div class="flex flex-wrap items-end justify-between gap-2">
                <div class="flex items-end gap-2">
                  <div class="text-[13px] font-semibold tracking-tight">按钮权限</div>
                  <div class="text-[12px] text-muted-foreground">(当前菜单下的按钮)</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  :disabled="!selectedMenuId"
                  @click="startCreateButton"
                >
                  + 添加按钮
                </Button>
              </div>

              <div class="rounded-lg bg-muted/20 p-3">
                <div
                  class="grid grid-cols-[140px_1fr_80px_80px_120px] gap-3 px-1 text-[12px] font-medium text-muted-foreground"
                >
                  <div>按钮名称</div>
                  <div>权限标识</div>
                  <div>排序</div>
                  <div>状态</div>
                  <div>操作</div>
                </div>
                <div class="mt-2 space-y-1">
                  <div
                    v-if="selectedButtonNodes.length === 0"
                    class="px-1 py-3 text-[12px] text-muted-foreground"
                  >
                    暂无按钮
                  </div>
                  <div
                    v-for="btn in selectedButtonNodes"
                    :key="btn.id ?? btn.perms ?? btn.menuName"
                    class="grid grid-cols-[140px_1fr_80px_80px_120px] gap-3 rounded-md px-1 py-2 text-[13px] hover:bg-accent"
                  >
                    <div class="truncate">{{ btn.menuName ?? "-" }}</div>
                    <div class="truncate font-mono text-[12px] text-primary/80">
                      {{ btn.perms ?? "-" }}
                    </div>
                    <div>{{ typeof btn.orderNum === "number" ? btn.orderNum : "-" }}</div>
                    <div>
                      <span
                        class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                        :class="[
                          btn.status === 1
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700',
                        ]"
                      >
                        {{ btn.status === 1 ? "启用" : "停用" }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3 text-[12px]">
                      <button
                        type="button"
                        class="text-primary hover:underline"
                        @click="btn.id && selectMenu(btn.id)"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        class="text-destructive hover:underline"
                        @click="btn.id && deleteMenuNode(btn.id)"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="grid gap-2">
              <Label for="menu-remark">备注</Label>
              <textarea
                id="menu-remark"
                v-model="form.remark"
                :class="textareaClass"
                placeholder="可选"
              />
            </div>
          </CardContent>

          <CardFooter class="flex flex-wrap justify-end gap-2 !p-4 !pt-0">
            <Button type="button" variant="outline" :disabled="isSaving" @click="onReset"
              >重置</Button
            >
          </CardFooter>
        </form>
      </Card>
    </div>
  </div>
</template>
