<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #system-role-page | Time: 2026-01-04T00:00:00+08:00
Principle: UI scaffold first; permissions are explicit tree data.
Taste: Left list + right details + tabs.
-->

<script setup lang="ts">
import type { MenuVO } from "@/schemas/system/menu"
import type { RoleQuery, RoleUpdateRequest, RoleVO } from "@/schemas/system/role"

import { computed, reactive, ref, watch } from "vue"
import { toast } from "vue-sonner"

import AppIcon from "@/components/app-icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useMenuTreeQuery } from "@/queries/system/menu"
import { useRoleMenuIdsQuery, useRolePageQuery, useUpdateRoleMutation } from "@/queries/system/role"
import { formatDateTime } from "@/utils/date"

function isKeyLike(value: string) {
  return /^[a-z0-9:_-]+$/i.test(value)
}

const roleKeyword = ref("")

const roleQuery = computed<RoleQuery>(() => {
  const keyword = roleKeyword.value.trim()
  const keyLike = keyword && isKeyLike(keyword)

  return {
    pageNum: 1,
    pageSize: 200,
    ...(keyword ? (keyLike ? { roleKey: keyword } : { roleName: keyword }) : {}),
  }
})

const rolePageQuery = useRolePageQuery(roleQuery)
const roleRows = computed(() => rolePageQuery.data.value?.records ?? [])

const selectedRoleId = ref<number | null>(null)

watch(
  roleRows,
  (rows) => {
    const currentId = selectedRoleId.value
    if (currentId && rows.some((r) => r.id === currentId)) return
    const first = rows.find((r) => typeof r.id === "number" && r.id > 0)
    selectedRoleId.value = first?.id ?? null
  },
  { immediate: true },
)

const selectedRole = computed(() => {
  const id = selectedRoleId.value
  if (!id) return null
  return roleRows.value.find((r) => r.id === id) ?? null
})

function selectRole(roleId: number) {
  selectedRoleId.value = roleId
}

function toRoleName(role: RoleVO) {
  return role.roleName?.trim() || "-"
}

function toRoleKey(role: RoleVO) {
  return role.roleKey?.trim() || "-"
}

function toRoleDesc(role: RoleVO) {
  return role.remark?.trim() || "-"
}

function toRoleScope(role: RoleVO) {
  return toRoleKey(role).toLowerCase() === "admin" ? "system" : "custom"
}

function isRoleDisabled(role: RoleVO) {
  return role.status === 0
}

function toDateTimeText(value?: string) {
  const raw = typeof value === "string" ? value.trim() : ""
  if (!raw) return "-"
  const formatted = formatDateTime(raw)
  return formatted === "Invalid Date" ? raw : formatted
}

type TabKey = "menu" | "data" | "users"
const activeTab = ref<TabKey>("menu")

interface PermissionNode {
  id: number
  name: string
  node: MenuVO
  children: PermissionNode[]
}

function toPermissionName(node: MenuVO, fallbackId: number) {
  const menuName = typeof node.menuName === "string" ? node.menuName.trim() : ""
  if (menuName) return menuName
  const perms = typeof node.perms === "string" ? node.perms.trim() : ""
  if (perms) return perms
  const path = typeof node.path === "string" ? node.path.trim() : ""
  if (path) return path
  return `#${fallbackId}`
}

function normalizePermissionTree(nodes: MenuVO[]): PermissionNode[] {
  const out: PermissionNode[] = []
  for (const node of nodes) {
    const id = node.id
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) continue
    const children = Array.isArray(node.children) ? normalizePermissionTree(node.children) : []
    out.push({ id, name: toPermissionName(node, id), node, children })
  }
  return out
}

const menuTreeQuery = useMenuTreeQuery()
const permissionTree = computed(() => normalizePermissionTree(menuTreeQuery.data.value ?? []))

interface PermissionRow {
  id: number
  name: string
  level: number
  hasChildren: boolean
  isExpanded: boolean
  node: PermissionNode
}

const expandedPermissionIds = reactive(new Set<number>())
watch(
  permissionTree,
  (nodes) => {
    if (expandedPermissionIds.size > 0) return
    const ids: number[] = []
    collectExpandablePermissionIds(nodes, ids)
    for (const id of ids) expandedPermissionIds.add(id)
  },
  { immediate: true },
)

const checkedPermissionIds = reactive(new Set<number>())
const roleMenuIdsQuery = useRoleMenuIdsQuery(selectedRoleId)
watch(
  [selectedRoleId, () => roleMenuIdsQuery.data.value],
  ([roleId, menuIds]) => {
    checkedPermissionIds.clear()
    if (!roleId || !menuIds) return
    for (const id of menuIds) {
      if (typeof id === "number" && Number.isInteger(id) && id > 0) checkedPermissionIds.add(id)
    }
  },
  { immediate: true },
)

function togglePermissionExpanded(id: number) {
  if (expandedPermissionIds.has(id)) expandedPermissionIds.delete(id)
  else expandedPermissionIds.add(id)
}

function collectPermissionIds(nodes: PermissionNode[], ids: number[]) {
  for (const node of nodes) {
    ids.push(node.id)
    if (node.children.length > 0) collectPermissionIds(node.children, ids)
  }
}

function collectExpandablePermissionIds(nodes: PermissionNode[], ids: number[]) {
  for (const node of nodes) {
    if (node.children.length > 0) {
      ids.push(node.id)
      collectExpandablePermissionIds(node.children, ids)
    }
  }
}

function setAllPermissions(value: boolean) {
  checkedPermissionIds.clear()
  if (!value) return
  const ids: number[] = []
  collectPermissionIds(permissionTree.value, ids)
  for (const id of ids) checkedPermissionIds.add(id)
}

function expandCollapseAll() {
  const ids: number[] = []
  collectPermissionIds(permissionTree.value, ids)
  const hasAllExpanded = ids.every((id) => expandedPermissionIds.has(id))
  if (hasAllExpanded) expandedPermissionIds.clear()
  else for (const id of ids) expandedPermissionIds.add(id)
}

function setPermissionChecked(id: number, value: boolean, node?: PermissionNode) {
  if (value) checkedPermissionIds.add(id)
  else checkedPermissionIds.delete(id)

  const target = node
  if (!target) return
  const children = target.children
  if (children.length === 0) return

  const ids: number[] = []
  collectPermissionIds(children, ids)
  for (const childId of ids) {
    if (value) checkedPermissionIds.add(childId)
    else checkedPermissionIds.delete(childId)
  }
}

const updateRoleMutation = useUpdateRoleMutation()
const isSavingPermissions = computed(() => updateRoleMutation.isPending.value)

async function saveMenuPermissions() {
  const role = selectedRole.value
  const roleId = role?.id
  if (typeof roleId !== "number" || roleId <= 0) {
    toast.error("请先选择角色")
    return
  }

  const roleName = role.roleName?.trim()
  const roleKey = role.roleKey?.trim()
  if (!roleName || !roleKey) {
    toast.error("角色信息不完整，无法保存权限")
    return
  }

  const payload: RoleUpdateRequest = {
    id: roleId,
    roleName,
    roleKey,
    orderNum: typeof role.orderNum === "number" ? role.orderNum : undefined,
    dataScope: typeof role.dataScope === "number" ? role.dataScope : undefined,
    status: typeof role.status === "number" ? role.status : undefined,
    remark: role.remark,
    menuIds: [...checkedPermissionIds],
  }

  try {
    await updateRoleMutation.mutateAsync(payload)
    toast.success("权限已保存")
  } catch (error) {
    console.error("[SystemRole] Failed to save role menus:", error)
    toast.error("保存失败，请稍后重试")
  }
}

const permissionRows = computed<PermissionRow[]>(() => {
  const rows: PermissionRow[] = []

  const walk = (nodes: PermissionNode[], level: number) => {
    for (const node of nodes) {
      const children = node.children
      const hasChildren = children.length > 0
      const isExpanded = expandedPermissionIds.has(node.id)

      rows.push({ id: node.id, name: node.name, level, hasChildren, isExpanded, node })
      if (hasChildren && isExpanded) walk(children, level + 1)
    }
  }

  walk(permissionTree.value, 0)
  return rows
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">角色管理</h1>
      <p class="text-[13px] text-muted-foreground">配置角色权限、数据权限范围</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Card class="overflow-hidden">
        <CardHeader
          class="flex flex-col gap-3 bg-muted/30 !p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <CardTitle class="text-base">角色列表</CardTitle>
          <Button type="button" size="sm">+ 新增</Button>
        </CardHeader>

        <CardContent class="grid gap-3 !p-4">
          <Input v-model="roleKeyword" placeholder="搜索角色名称/编码..." />
        </CardContent>

        <CardContent class="max-h-[70dvh] overflow-auto p-2">
          <ul class="space-y-1">
            <li v-for="role in roleRows" :key="role.id ?? role.roleKey ?? role.roleName">
              <button
                type="button"
                class="w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/60"
                :class="[
                  selectedRoleId === role.id
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-foreground',
                ]"
                @click="typeof role.id === 'number' && role.id > 0 && selectRole(role.id)"
              >
                <div class="min-w-0">
                  <div class="flex items-start gap-2">
                    <div class="min-w-0 flex-1 truncate text-[13px] font-semibold">
                      {{ toRoleName(role) }}
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <span
                        v-if="toRoleScope(role) === 'system'"
                        class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                        :class="[
                          toRoleScope(role) === 'system'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700',
                        ]"
                      >
                        {{ toRoleScope(role) === "system" ? "系统" : "自定义" }}
                      </span>
                      <span
                        v-if="isRoleDisabled(role)"
                        class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                        :class="[
                          isRoleDisabled(role)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700',
                        ]"
                      >
                        {{ isRoleDisabled(role) ? "停用" : "正常" }}
                      </span>
                    </div>
                  </div>
                  <div class="mt-1 truncate text-[12px] text-muted-foreground">
                    {{ toRoleKey(role) }} · {{ toRoleDesc(role) }}
                  </div>
                </div>
              </button>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card class="overflow-hidden">
        <CardHeader
          class="flex flex-col gap-3 bg-muted/30 !p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex flex-wrap items-center gap-2">
            <CardTitle class="text-base">
              {{ selectedRole ? toRoleName(selectedRole) : "角色详情" }}
            </CardTitle>
            <span v-if="selectedRole" class="text-[12px] text-muted-foreground">{{
              toRoleKey(selectedRole)
            }}</span>
            <span
              v-if="selectedRole"
              class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
              :class="[
                isRoleDisabled(selectedRole)
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700',
              ]"
            >
              {{ isRoleDisabled(selectedRole) ? "停用" : "正常" }}
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm">编辑</Button>
            <Button type="button" variant="outline" size="sm" class="text-destructive">删除</Button>
          </div>
        </CardHeader>

        <CardContent class="grid gap-3 !p-4">
          <div class="border-t pt-3 text-[13px]">
            <div class="grid gap-2">
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-[12px] text-muted-foreground">角色描述</span>
                <span class="text-foreground">{{
                  selectedRole ? toRoleDesc(selectedRole) : "-"
                }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-6">
                <div class="flex items-center gap-3">
                  <span class="text-[12px] text-muted-foreground">创建时间</span>
                  <span class="text-foreground">{{
                    toDateTimeText(selectedRole?.createTime)
                  }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-[12px] text-muted-foreground">更新时间</span>
                  <span class="text-foreground">{{
                    toDateTimeText(selectedRole?.updateTime)
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-muted/30 p-1">
            <div class="flex flex-wrap gap-1">
              <Button
                type="button"
                size="sm"
                :variant="activeTab === 'menu' ? 'default' : 'ghost'"
                class="h-10"
                @click="activeTab = 'menu'"
              >
                菜单权限
              </Button>
              <Button
                type="button"
                size="sm"
                :variant="activeTab === 'data' ? 'default' : 'ghost'"
                class="h-10"
                @click="activeTab = 'data'"
              >
                数据权限
              </Button>
              <Button
                type="button"
                size="sm"
                :variant="activeTab === 'users' ? 'default' : 'ghost'"
                class="h-10"
                @click="activeTab = 'users'"
              >
                关联用户
              </Button>
            </div>
          </div>

          <div v-if="activeTab === 'menu'" class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" @click="setAllPermissions(true)"
                >全选</Button
              >
              <Button type="button" variant="outline" size="sm" @click="setAllPermissions(false)"
                >取消全选</Button
              >
              <Button type="button" variant="outline" size="sm" @click="expandCollapseAll"
                >展开/收起</Button
              >
              <div class="flex-1" />
              <Button
                type="button"
                size="sm"
                :disabled="!selectedRole || isSavingPermissions"
                @click="saveMenuPermissions"
              >
                {{ isSavingPermissions ? "保存中..." : "保存权限" }}
              </Button>
            </div>

            <div class="rounded-lg bg-muted/20 p-3">
              <ul class="space-y-1">
                <li v-for="row in permissionRows" :key="row.id">
                  <div
                    class="flex items-center gap-2 rounded-md px-2 py-2 text-[13px] hover:bg-accent/60"
                    :style="{ paddingLeft: `${row.level * 18}px` }"
                  >
                    <Checkbox
                      :model-value="checkedPermissionIds.has(row.id)"
                      @update:model-value="(value) => setPermissionChecked(row.id, value, row.node)"
                    />
                    <button
                      v-if="row.hasChildren"
                      type="button"
                      class="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                      :aria-label="row.isExpanded ? '收起' : '展开'"
                      @click="togglePermissionExpanded(row.id)"
                    >
                      <AppIcon
                        icon="radix-icons:chevron-down"
                        class="h-4 w-4 transition-transform"
                        :class="[row.isExpanded ? 'rotate-0' : '-rotate-90']"
                      />
                    </button>
                    <span v-else class="inline-block size-7" />
                    <span class="min-w-0 flex-1 truncate">{{ row.name }}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div v-else class="rounded-lg bg-muted/20 p-6 text-[13px] text-muted-foreground">
            {{ activeTab === "data" ? "数据权限配置（待实现）" : "关联用户列表（待实现）" }}
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
