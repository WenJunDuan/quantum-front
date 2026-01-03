<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #system-menus-page | Time: 2026-01-02T00:00:00+08:00
Principle: Menu management is data-first: select → edit → save.
Taste: Two-panel layout with a simple tree and a clear form.
-->

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const notify = useNotifyStore()

const treeQuery = useMenuTreeQuery()
const treeNodes = computed(() => treeQuery.data.value ?? [])
const isTreeLoading = computed(() => treeQuery.isFetching.value)

const selectedMenuId = ref<number | null>(null)
const detailQuery = useMenuDetailQuery(selectedMenuId)
const selectedMenu = computed(() => detailQuery.data.value ?? null)
const isDetailLoading = computed(() => detailQuery.isFetching.value)

const mode = ref<PageMode>("create")
const treeFilter = ref("")

function flattenMenuTree(nodes: MenuVO[], level = 0, out: FlatMenuItem[] = []) {
  for (const node of nodes) {
    const id = node.id
    if (typeof id === "number" && Number.isInteger(id) && id > 0) {
      const label = (node.menuName ?? "").trim() || (node.path ?? "").trim() || `#${id}`
      out.push({ id, label, level, node })
    }

    const children = Array.isArray(node.children) ? node.children : []
    if (children.length > 0) flattenMenuTree(children, level + 1, out)
  }
  return out
}

const flatTree = computed(() => flattenMenuTree(treeNodes.value))

const filteredTree = computed(() => {
  const keyword = treeFilter.value.trim().toLowerCase()
  if (!keyword) return flatTree.value
  return flatTree.value.filter((item) => item.label.toLowerCase().includes(keyword))
})

const parentOptions = computed(() => [{ id: 0, label: "根目录", level: 0 }, ...flatTree.value])

const fieldClass =
  "flex h-11 w-full rounded-lg border border-input bg-background/55 px-4 py-2 text-[13px] shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 supports-[backdrop-filter]:bg-background/45"

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
    status: "0",
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
    status: typeof menu.status === "number" ? String(menu.status) : "0",
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
  if (deleteMutation.isPending.value) return
  if (mode.value !== "edit") return

  const menuId = toOptionalInt(form.id)
  if (!menuId) return

  if (!globalThis.confirm("确认删除该菜单？（如存在子菜单，请先处理）")) return

  try {
    await deleteMutation.mutateAsync(menuId)
    notify.success("菜单已删除")
    selectedMenuId.value = null
    startCreateRoot()
    await treeQuery.refetch()
  } catch {
    // errors are handled globally by request/notify
  }
}
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div class="min-w-0">
        <h2 class="text-xl font-semibold tracking-tight">菜单管理</h2>
        <p class="mt-1 text-[13px] text-muted-foreground">左侧选择菜单树，右侧维护菜单详情。</p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          class="h-11"
          :disabled="isTreeLoading"
          @click="refreshTree"
        >
          刷新
        </Button>
        <Button type="button" class="h-11" @click="startCreateRoot">新建根菜单</Button>
        <Button
          type="button"
          variant="outline"
          class="h-11"
          :disabled="!selectedMenuId"
          @click="startCreateChild"
        >
          新建子菜单
        </Button>
      </div>
    </header>

    <div class="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card class="overflow-hidden">
        <CardHeader class="space-y-2">
          <CardTitle>菜单树</CardTitle>
          <Input v-model="treeFilter" placeholder="搜索菜单名称..." />
        </CardHeader>
        <CardContent class="max-h-[70dvh] overflow-auto p-2">
          <div v-if="isTreeLoading" class="p-3 text-sm text-muted-foreground">加载中...</div>
          <div v-else-if="filteredTree.length === 0" class="p-3 text-sm text-muted-foreground">
            暂无数据
          </div>
          <ul v-else class="space-y-1">
            <li v-for="item in filteredTree" :key="item.id">
              <Button
                type="button"
                variant="ghost"
                class="h-10 w-full justify-start rounded-lg px-2 text-[13px] font-medium"
                :class="[
                  selectedMenuId === item.id
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground hover:shadow-sm',
                ]"
                @click="selectMenu(item.id)"
              >
                <span
                  class="flex w-full items-center gap-2"
                  :style="{ paddingLeft: `${item.level * 12}px` }"
                >
                  <span class="truncate">{{ item.label }}</span>
                </span>
              </Button>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <form class="grid gap-6" @submit.prevent="onSave">
          <CardHeader class="space-y-1">
            <CardTitle>{{ mode === "edit" ? "编辑菜单" : "新建菜单" }}</CardTitle>
            <p class="text-[12px] text-muted-foreground">
              {{
                mode === "edit"
                  ? isDetailLoading
                    ? "加载详情中..."
                    : "选择左侧节点后可编辑"
                  : "填写信息后保存创建"
              }}
            </p>
          </CardHeader>

          <CardContent class="grid gap-4">
            <div v-if="mode === 'edit'" class="grid gap-2">
              <Label for="menu-id">菜单ID</Label>
              <input id="menu-id" :value="form.id" class="font-mono" :class="fieldClass" disabled />
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div class="grid gap-2">
                <Label for="menu-parentId">父菜单</Label>
                <select id="menu-parentId" v-model="form.parentId" :class="fieldClass">
                  <option v-for="opt in parentOptions" :key="opt.id" :value="String(opt.id)">
                    {{ `${"—".repeat(opt.level)}${opt.level ? " " : ""}${opt.label}` }}
                  </option>
                </select>
              </div>

              <div class="grid gap-2">
                <Label for="menu-orderNum">排序</Label>
                <input
                  id="menu-orderNum"
                  v-model="form.orderNum"
                  inputmode="numeric"
                  :class="fieldClass"
                />
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <Label for="menu-name">菜单名称 *</Label>
                <Input id="menu-name" v-model="form.menuName" placeholder="例如：菜单管理" />
              </div>

              <div class="grid gap-2">
                <Label for="menu-type">菜单类型 *</Label>
                <select id="menu-type" v-model="form.menuType" :class="fieldClass">
                  <option value="M">目录（M）</option>
                  <option value="C">菜单（C）</option>
                  <option value="F">按钮（F）</option>
                </select>
              </div>

              <div class="grid gap-2">
                <Label for="menu-visible">是否显示</Label>
                <select id="menu-visible" v-model="form.visible" :class="fieldClass">
                  <option value="0">显示（0）</option>
                  <option value="1">隐藏（1）</option>
                </select>
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <Label for="menu-path">路由地址（path）</Label>
                <Input id="menu-path" v-model="form.path" placeholder="例如：system/menus" />
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <Label for="menu-component">组件路径（component）</Label>
                <Input
                  id="menu-component"
                  v-model="form.component"
                  placeholder="例如：system/menus"
                />
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <Label for="menu-queryParam">路由参数（queryParam）</Label>
                <Input
                  id="menu-queryParam"
                  v-model="form.queryParam"
                  placeholder='例如：{"id":1}'
                />
              </div>

              <div class="grid gap-2">
                <Label for="menu-isFrame">是否外链（isFrame）</Label>
                <select id="menu-isFrame" v-model="form.isFrame" :class="fieldClass">
                  <option value="0">否（0）</option>
                  <option value="1">是（1）</option>
                </select>
              </div>

              <div class="grid gap-2">
                <Label for="menu-isCache">是否缓存（isCache）</Label>
                <select id="menu-isCache" v-model="form.isCache" :class="fieldClass">
                  <option value="0">缓存（0）</option>
                  <option value="1">不缓存（1）</option>
                </select>
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <Label for="menu-perms">权限标识（perms）</Label>
                <Input id="menu-perms" v-model="form.perms" placeholder="例如：system:menu:list" />
              </div>

              <div class="grid gap-2">
                <Label for="menu-icon">图标（icon）</Label>
                <Input id="menu-icon" v-model="form.icon" placeholder="例如：menu" />
              </div>

              <div class="grid gap-2">
                <Label for="menu-status">状态（status）</Label>
                <select id="menu-status" v-model="form.status" :class="fieldClass">
                  <option value="0">正常（0）</option>
                  <option value="1">停用（1）</option>
                </select>
              </div>

              <div class="grid gap-2 sm:col-span-2">
                <Label for="menu-remark">备注（remark）</Label>
                <textarea
                  id="menu-remark"
                  v-model="form.remark"
                  :class="textareaClass"
                  placeholder="可选"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter class="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" :disabled="isSaving" @click="onReset"
              >重置</Button
            >
            <Button
              v-if="mode === 'edit'"
              type="button"
              variant="destructive"
              :disabled="deleteMutation.isPending.value"
              @click="onDelete"
            >
              删除
            </Button>
            <Button type="submit" :disabled="isSaving">
              {{ isSaving ? "保存中..." : "保存" }}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  </div>
</template>
