<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #system-user-page | Time: 2026-01-04T00:00:00+08:00
Principle: UI-first scaffold; keep data structures explicit.
Taste: Calm shadcn-like layout: tree + table.
-->

<script setup lang="ts">
import type { DeptQuery, TreeSelectVO } from "@/schemas/system/dept"

import { computed, reactive, ref, watch } from "vue"

import AppIcon from "@/components/app-icon"
import AppPagination from "@/components/app-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useDeptTreeSelectQuery } from "@/queries/system/dept"
import {
  useCreateUserMutation,
  useDeleteUsersMutation,
  useUpdateUserMutation,
  useUserPageQuery,
} from "@/queries/system/user"
import {
  UserCreateRequestSchema,
  UserUpdateRequestSchema,
  type UserCreateRequest,
  type UserQuery,
  type UserUpdateRequest,
  type UserVO,
} from "@/schemas/system/user"
import { useNotifyStore } from "@/stores/notify"
import { formatDateTime } from "@/utils/date"

interface DeptTreeItem {
  id: number
  label: string
  children: DeptTreeItem[]
}

function normalizeTreeSelect(nodes: TreeSelectVO[]): DeptTreeItem[] {
  const out: DeptTreeItem[] = []

  for (const node of nodes) {
    const children = Array.isArray(node.children) ? normalizeTreeSelect(node.children) : []

    const id = node.id
    if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
      if (children.length > 0) out.push(...children)
      continue
    }

    const label = (node.label ?? "").trim() || `#${id}`
    out.push({ id, label, children })
  }

  return out
}

interface DeptRow {
  id: number
  label: string
  level: number
  hasChildren: boolean
  isExpanded: boolean
}

const deptKeyword = ref("")
const selectedDeptId = ref<number | null>(null)
const expandedDeptIds = reactive(new Set<number>())

function toggleDeptExpanded(deptId: number) {
  if (expandedDeptIds.has(deptId)) expandedDeptIds.delete(deptId)
  else expandedDeptIds.add(deptId)
}

function selectDept(deptId: number) {
  selectedDeptId.value = deptId
}

function filterDeptTree(items: DeptTreeItem[], keyword: string): DeptTreeItem[] {
  if (!keyword) return items

  const output: DeptTreeItem[] = []
  for (const item of items) {
    const children = filterDeptTree(item.children, keyword)
    const hit = item.label.toLowerCase().includes(keyword)
    if (hit || children.length > 0) output.push({ ...item, children })
  }
  return output
}

const deptQuery = computed<DeptQuery>(() => ({}))
const deptTreeSelectQuery = useDeptTreeSelectQuery(deptQuery)
const deptTree = computed(() => normalizeTreeSelect(deptTreeSelectQuery.data.value ?? []))

const hasInitializedDeptExpand = ref(false)
watch(
  deptTree,
  (tree) => {
    if (hasInitializedDeptExpand.value) return
    if (tree.length === 0) return
    expandedDeptIds.clear()

    const walk = (items: DeptTreeItem[]) => {
      for (const item of items) {
        if (item.children.length > 0) {
          expandedDeptIds.add(item.id)
          walk(item.children)
        }
      }
    }

    walk(tree)
    hasInitializedDeptExpand.value = true
  },
  { immediate: true },
)

const filteredDeptTree = computed(() =>
  filterDeptTree(deptTree.value, deptKeyword.value.trim().toLowerCase()),
)

const deptRows = computed<DeptRow[]>(() => {
  const rows: DeptRow[] = []
  const forceExpand = Boolean(deptKeyword.value.trim())

  const walk = (items: DeptTreeItem[], level: number) => {
    for (const item of items) {
      const children = item.children
      const hasChildren = children.length > 0
      const isExpanded = forceExpand || expandedDeptIds.has(item.id)

      rows.push({
        id: item.id,
        label: item.label,
        level,
        hasChildren,
        isExpanded,
      })

      if (hasChildren && isExpanded) walk(children, level + 1)
    }
  }

  walk(filteredDeptTree.value, 0)
  return rows
})

const usernameKeyword = ref("")
const nicknameKeyword = ref("")
const phoneKeyword = ref("")
const statusFilter = ref<"" | "1" | "0">("")
const pageNum = ref(1)
const pageSize = ref(10)

const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "启用", value: "1" },
  { label: "停用", value: "0" },
]

const notify = useNotifyStore()

const normalizedUserQuery = computed<UserQuery>(() => {
  const username = usernameKeyword.value.trim()
  const nickname = nicknameKeyword.value.trim()
  const phone = phoneKeyword.value.trim()
  const status = statusFilter.value === "" ? undefined : Number(statusFilter.value)

  return {
    pageNum: pageNum.value,
    pageSize: pageSize.value,
    deptId: selectedDeptId.value ?? undefined,
    status,
    ...(username ? { username } : {}),
    ...(nickname ? { nickname } : {}),
    ...(phone ? { phone } : {}),
  }
})

watch([selectedDeptId, usernameKeyword, nicknameKeyword, phoneKeyword, statusFilter], () => {
  pageNum.value = 1
})

const userPageQuery = useUserPageQuery(normalizedUserQuery)

const userRows = computed(() => userPageQuery.data.value?.records ?? [])
const totalUsers = computed(() => userPageQuery.data.value?.total ?? 0)
const totalPages = computed(() => userPageQuery.data.value?.pages ?? 0)

function searchUsers() {
  pageNum.value = 1
  void userPageQuery.refetch()
}

const createUserMutation = useCreateUserMutation()
const updateUserMutation = useUpdateUserMutation()
const deleteUsersMutation = useDeleteUsersMutation()

const selectedUserIds = reactive(new Set<number>())

const selectableUserIds = computed(() =>
  userRows.value
    .map((row) => row.id)
    .filter((id): id is number => typeof id === "number" && Number.isInteger(id) && id > 0),
)

const isAllSelected = computed(() => {
  const ids = selectableUserIds.value
  return ids.length > 0 && ids.every((id) => selectedUserIds.has(id))
})

watch(
  userRows,
  () => {
    selectedUserIds.clear()
  },
  { deep: true },
)

function setUserSelected(userId: number, value: boolean) {
  if (value) selectedUserIds.add(userId)
  else selectedUserIds.delete(userId)
}

function setAllSelected(value: boolean) {
  selectedUserIds.clear()
  if (!value) return
  for (const id of selectableUserIds.value) selectedUserIds.add(id)
}

function toDisplayName(user: UserVO) {
  return user.nickname?.trim() || user.username?.trim() || "-"
}

function toDisplayEmail(user: UserVO) {
  return user.email?.trim() || "-"
}

function toDisplayDept(user: UserVO) {
  return user.deptName?.trim() || "-"
}

function toDisplayRoles(user: UserVO) {
  const roles = Array.isArray(user.roles)
    ? user.roles.filter((r) => typeof r === "string" && r.trim())
    : []
  return roles.length > 0 ? roles.join("、") : "-"
}

function toStatusText(user: UserVO) {
  return user.status === 1 ? "启用" : "停用"
}

function toStatusClass(user: UserVO) {
  return user.status === 1 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
}

function toDateTimeText(value?: string) {
  const raw = typeof value === "string" ? value.trim() : ""
  if (!raw) return "-"
  const formatted = formatDateTime(raw)
  return formatted === "Invalid Date" ? raw : formatted
}

type UserFormMode = "create" | "edit"
const isUserFormOpen = ref(false)
const userFormMode = ref<UserFormMode>("create")

const userForm = reactive({
  id: 0,
  username: "",
  password: "",
  nickname: "",
  phone: "",
  email: "",
  status: "1",
  remark: "",
})

const isUserFormSubmitting = computed(
  () => createUserMutation.isPending.value || updateUserMutation.isPending.value,
)

function resetUserForm() {
  userForm.id = 0
  userForm.username = ""
  userForm.password = ""
  userForm.nickname = ""
  userForm.phone = ""
  userForm.email = ""
  userForm.status = "1"
  userForm.remark = ""
}

function openCreateUser() {
  userFormMode.value = "create"
  resetUserForm()
  isUserFormOpen.value = true
}

function openEditUser(row: UserVO) {
  const id = row.id
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    notify.error("用户ID无效，无法编辑")
    return
  }

  userFormMode.value = "edit"
  userForm.id = id
  userForm.username = row.username?.trim() ?? ""
  userForm.password = ""
  userForm.nickname = row.nickname?.trim() ?? ""
  userForm.phone = row.phone?.trim() ?? ""
  userForm.email = row.email?.trim() ?? ""
  userForm.status = typeof row.status === "number" ? String(row.status) : "1"
  userForm.remark = row.remark?.trim() ?? ""
  isUserFormOpen.value = true
}

function closeUserForm() {
  isUserFormOpen.value = false
}

function buildCreatePayload(): UserCreateRequest {
  return UserCreateRequestSchema.parse({
    username: userForm.username.trim(),
    password: userForm.password,
    nickname: userForm.nickname.trim(),
    phone: userForm.phone.trim() || undefined,
    email: userForm.email.trim() || undefined,
    deptId: selectedDeptId.value ?? undefined,
    status: Number(userForm.status),
    remark: userForm.remark.trim() || undefined,
  })
}

function buildUpdatePayload(): UserUpdateRequest {
  return UserUpdateRequestSchema.parse({
    id: userForm.id,
    nickname: userForm.nickname.trim(),
    phone: userForm.phone.trim() || undefined,
    email: userForm.email.trim() || undefined,
    status: Number(userForm.status),
    remark: userForm.remark.trim() || undefined,
  })
}

async function submitUserForm() {
  try {
    if (userFormMode.value === "create") {
      await createUserMutation.mutateAsync(buildCreatePayload())
      notify.success("用户已创建")
    } else {
      await updateUserMutation.mutateAsync(buildUpdatePayload())
      notify.success("用户已更新")
    }
    closeUserForm()
  } catch (error) {
    console.error("[SystemUser] Failed to submit user form:", error)
    notify.error("提交失败，请检查输入或稍后重试")
  }
}

const isBatchStatusSubmitting = ref(false)

async function updateSelectedUsersStatus(nextStatus: number) {
  const ids = [...selectedUserIds]
  if (ids.length === 0) return

  const actionLabel = nextStatus === 1 ? "启用" : "停用"
  if (!globalThis.confirm(`确认${actionLabel}选中的 ${ids.length} 个用户？`)) return

  const rowById = new Map<number, UserVO>()
  for (const row of userRows.value) {
    const id = row.id
    if (typeof id === "number" && Number.isInteger(id) && id > 0) rowById.set(id, row)
  }

  isBatchStatusSubmitting.value = true
  try {
    for (const id of ids) {
      const row = rowById.get(id)
      if (!row) continue
      const nickname = row.nickname?.trim() || row.username?.trim() || ""
      if (!nickname) continue

      await updateUserMutation.mutateAsync(
        UserUpdateRequestSchema.parse({
          id,
          nickname,
          phone: row.phone?.trim() || undefined,
          email: row.email?.trim() || undefined,
          status: nextStatus,
          remark: row.remark?.trim() || undefined,
        }),
      )
    }

    selectedUserIds.clear()
    notify.success(`${actionLabel}成功`)
  } catch (error) {
    console.error("[SystemUser] Failed to update users status:", error)
    notify.error(`${actionLabel}失败，请稍后重试`)
  } finally {
    isBatchStatusSubmitting.value = false
  }
}

function exportUserList() {
  notify.info("导出功能待对接接口")
}

async function deleteSelectedUsers() {
  const ids = [...selectedUserIds]
  if (ids.length === 0) return
  if (!globalThis.confirm(`确认删除选中的 ${ids.length} 个用户？`)) return

  try {
    await deleteUsersMutation.mutateAsync(ids)
    selectedUserIds.clear()
    notify.success("删除成功")
  } catch (error) {
    console.error("[SystemUser] Failed to delete users:", error)
    notify.error("删除失败，请稍后重试")
  }
}

async function deleteUserById(userId: number) {
  if (!globalThis.confirm("确认删除该用户？")) return

  try {
    await deleteUsersMutation.mutateAsync([userId])
    selectedUserIds.delete(userId)
    notify.success("删除成功")
  } catch (error) {
    console.error("[SystemUser] Failed to delete user:", error)
    notify.error("删除失败，请稍后重试")
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">用户管理</h1>
      <p class="text-[13px] text-muted-foreground">管理系统用户账号、权限分配</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <Card class="overflow-hidden">
        <CardHeader class="bg-muted/30 !p-4">
          <CardTitle class="text-base">组织架构</CardTitle>
        </CardHeader>

        <CardContent class="grid gap-3 !p-4">
          <Input v-model="deptKeyword" placeholder="搜索部门..." />
        </CardContent>

        <CardContent class="max-h-[70dvh] overflow-auto p-2">
          <ul class="space-y-1">
            <li v-for="row in deptRows" :key="row.id">
              <div
                role="button"
                tabindex="0"
                class="flex items-center gap-2 rounded-lg px-2 py-2 text-[13px] transition-colors"
                :class="[
                  selectedDeptId === row.id
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                ]"
                :style="{ paddingLeft: `${row.level * 16}px` }"
                @click="selectDept(row.id)"
              >
                <button
                  v-if="row.hasChildren"
                  type="button"
                  class="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  :aria-label="row.isExpanded ? '收起' : '展开'"
                  @click.stop="toggleDeptExpanded(row.id)"
                >
                  <AppIcon
                    icon="radix-icons:chevron-down"
                    class="h-4 w-4 transition-transform duration-200"
                    :class="[row.isExpanded ? 'rotate-0' : '-rotate-90']"
                  />
                </button>
                <span v-else class="inline-block size-7" />

                <span class="min-w-0 flex-1 truncate">{{ row.label }}</span>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <div class="w-full sm:w-[220px]">
            <Input v-model="usernameKeyword" placeholder="用户名" />
          </div>

          <div class="w-full sm:w-[200px]">
            <Input v-model="nicknameKeyword" placeholder="姓名" />
          </div>

          <div class="w-full sm:w-[200px]">
            <Input v-model="phoneKeyword" placeholder="手机号" />
          </div>

          <div class="w-full sm:w-[160px]">
            <Select v-model="statusFilter" :options="statusOptions" />
          </div>

          <Button type="button" variant="outline" @click="searchUsers">
            <AppIcon icon="radix-icons:magnifying-glass" class="h-4 w-4" />
            搜索
          </Button>

          <div class="flex-1" />

          <Button type="button" @click="openCreateUser">+ 新增</Button>
          <Button
            type="button"
            variant="outline"
            :disabled="
              selectedUserIds.size === 0 ||
              isBatchStatusSubmitting ||
              updateUserMutation.isPending.value ||
              deleteUsersMutation.isPending.value
            "
            @click="updateSelectedUsersStatus(1)"
          >
            启用
          </Button>
          <Button
            type="button"
            variant="outline"
            :disabled="
              selectedUserIds.size === 0 ||
              isBatchStatusSubmitting ||
              updateUserMutation.isPending.value ||
              deleteUsersMutation.isPending.value
            "
            @click="updateSelectedUsersStatus(0)"
          >
            停用
          </Button>
          <Button
            type="button"
            variant="destructive"
            :disabled="selectedUserIds.size === 0 || deleteUsersMutation.isPending.value"
            @click="deleteSelectedUsers"
          >
            删除
          </Button>

          <details class="relative">
            <Button as-child variant="outline">
              <summary class="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                更多
              </summary>
            </Button>

            <div
              class="absolute right-0 z-10 mt-2 w-[120px] overflow-hidden rounded-lg border border-input bg-popover p-1 text-popover-foreground shadow-md"
            >
              <button
                type="button"
                class="w-full rounded-md px-3 py-2 text-left text-[13px] transition-colors hover:bg-accent hover:text-accent-foreground"
                @click="exportUserList"
              >
                导出
              </button>
            </div>
          </details>
        </div>

        <Card class="overflow-hidden">
          <CardContent class="!p-0">
            <table class="w-full text-[13px]">
              <thead class="bg-muted/30 text-[12px] text-muted-foreground">
                <tr>
                  <th class="w-10 p-3 text-left">
                    <Checkbox :model-value="isAllSelected" @update:model-value="setAllSelected" />
                  </th>
                  <th class="p-3 text-left font-medium">用户信息</th>
                  <th class="p-3 text-left font-medium">所属部门</th>
                  <th class="p-3 text-left font-medium">角色</th>
                  <th class="p-3 text-left font-medium">手机号</th>
                  <th class="p-3 text-left font-medium">状态</th>
                  <th class="p-3 text-left font-medium">创建时间</th>
                  <th class="p-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in userRows"
                  :key="row.id ?? row.username ?? row.nickname"
                  class="border-t hover:bg-accent/40"
                >
                  <td class="w-10 p-3 align-middle">
                    <Checkbox
                      :disabled="!(typeof row.id === 'number' && row.id > 0)"
                      :model-value="typeof row.id === 'number' && selectedUserIds.has(row.id)"
                      @update:model-value="
                        (value) => typeof row.id === 'number' && setUserSelected(row.id, value)
                      "
                    />
                  </td>
                  <td class="p-3 align-middle">
                    <div class="flex items-center gap-3">
                      <div
                        class="grid size-9 place-items-center rounded-full bg-muted text-[12px] font-semibold text-muted-foreground"
                      >
                        {{ toDisplayName(row).slice(0, 1) }}
                      </div>
                      <div class="min-w-0">
                        <div class="truncate font-medium text-foreground">
                          {{ toDisplayName(row) }}
                        </div>
                        <div class="truncate text-[12px] text-muted-foreground">
                          {{ toDisplayEmail(row) }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="p-3 align-middle">{{ toDisplayDept(row) }}</td>
                  <td class="p-3 align-middle">{{ toDisplayRoles(row) }}</td>
                  <td class="p-3 align-middle">{{ row.phone ?? "-" }}</td>
                  <td class="p-3 align-middle">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                      :class="toStatusClass(row)"
                    >
                      {{ toStatusText(row) }}
                    </span>
                  </td>
                  <td class="p-3 align-middle">{{ toDateTimeText(row.createTime) }}</td>
                  <td class="p-3 align-middle">
                    <div class="flex items-center gap-3 text-[12px]">
                      <button
                        type="button"
                        class="text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="!(typeof row.id === 'number' && row.id > 0)"
                        @click="openEditUser(row)"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        class="text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="
                          !(typeof row.id === 'number' && row.id > 0) ||
                          deleteUsersMutation.isPending.value
                        "
                        @click="typeof row.id === 'number' && row.id > 0 && deleteUserById(row.id)"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="userRows.length === 0">
                  <td colspan="8" class="p-6 text-center text-[13px] text-muted-foreground">
                    {{ userPageQuery.isFetching.value ? "加载中..." : "暂无数据" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <AppPagination
          :total="totalUsers"
          :pages="totalPages"
          :page-num="pageNum"
          :page-size="pageSize"
          :disabled="userPageQuery.isFetching.value"
          @update:page-num="pageNum = $event"
          @update:page-size="pageSize = $event"
        />
      </div>
    </div>

    <div
      v-if="isUserFormOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeUserForm"
    >
      <Card class="w-full max-w-[520px] overflow-hidden">
        <CardHeader class="bg-muted/30 !p-4">
          <CardTitle class="text-base">{{
            userFormMode === "create" ? "新增用户" : "编辑用户"
          }}</CardTitle>
        </CardHeader>

        <CardContent class="grid gap-4 !p-4">
          <div class="grid gap-2">
            <Label for="user-username">用户名</Label>
            <Input
              id="user-username"
              v-model="userForm.username"
              :disabled="userFormMode !== 'create' || isUserFormSubmitting"
              placeholder="请输入用户名"
            />
          </div>

          <div v-if="userFormMode === 'create'" class="grid gap-2">
            <Label for="user-password">密码</Label>
            <Input
              id="user-password"
              v-model="userForm.password"
              type="password"
              :disabled="isUserFormSubmitting"
              placeholder="请输入密码"
            />
          </div>

          <div class="grid gap-2">
            <Label for="user-nickname">昵称</Label>
            <Input
              id="user-nickname"
              v-model="userForm.nickname"
              :disabled="isUserFormSubmitting"
              placeholder="请输入昵称"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="user-phone">手机号</Label>
              <Input
                id="user-phone"
                v-model="userForm.phone"
                :disabled="isUserFormSubmitting"
                placeholder="可选"
              />
            </div>
            <div class="grid gap-2">
              <Label for="user-email">邮箱</Label>
              <Input
                id="user-email"
                v-model="userForm.email"
                :disabled="isUserFormSubmitting"
                placeholder="可选"
              />
            </div>
          </div>

          <div class="grid gap-2">
            <Label>状态</Label>
            <div class="flex flex-wrap gap-4">
              <label class="inline-flex items-center gap-2 text-[13px]">
                <input
                  v-model="userForm.status"
                  type="radio"
                  value="1"
                  class="h-4 w-4 accent-primary"
                  :disabled="isUserFormSubmitting"
                />
                启用
              </label>
              <label class="inline-flex items-center gap-2 text-[13px]">
                <input
                  v-model="userForm.status"
                  type="radio"
                  value="0"
                  class="h-4 w-4 accent-primary"
                  :disabled="isUserFormSubmitting"
                />
                停用
              </label>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="user-remark">备注</Label>
            <textarea
              id="user-remark"
              v-model="userForm.remark"
              :disabled="isUserFormSubmitting"
              class="min-h-[96px] w-full rounded-lg border border-input bg-background/55 px-4 py-2 text-[13px] shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="可选"
            />
          </div>
        </CardContent>

        <CardContent class="flex flex-wrap justify-end gap-2 !p-4 !pt-0">
          <Button
            type="button"
            variant="outline"
            :disabled="isUserFormSubmitting"
            @click="closeUserForm"
          >
            取消
          </Button>
          <Button type="button" :disabled="isUserFormSubmitting" @click="submitUserForm">
            {{ isUserFormSubmitting ? "保存中..." : "保存" }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
