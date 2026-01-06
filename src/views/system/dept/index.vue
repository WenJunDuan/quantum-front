<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #system-dept-page | Time: 2026-01-04T00:00:00+08:00
Principle: Department is hierarchical data; UI is a tree-table.
Taste: One card, clear toolbar, readable rows.
-->

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"
import { toast } from "vue-sonner"

import AppIcon from "@/components/app-icon"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  useCreateDeptMutation,
  useDeleteDeptMutation,
  useDeptTreeQuery,
  useUpdateDeptMutation,
} from "@/queries/system/dept"
import {
  DeptCreateRequestSchema,
  DeptUpdateRequestSchema,
  type DeptCreateRequest,
  type DeptQuery,
  type DeptUpdateRequest,
  type DeptVO,
} from "@/schemas/system/dept"

interface DeptRow {
  id: number
  level: number
  node: DeptVO
  hasChildren: boolean
  isExpanded: boolean
}

const keyword = ref("")
const statusFilter = ref<"" | "1" | "0">("")
const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "启用", value: "1" },
  { label: "停用", value: "0" },
]

const deptQuery = computed<DeptQuery>(() => {
  const status = statusFilter.value === "" ? undefined : Number(statusFilter.value)
  return typeof status === "number" ? { status } : {}
})
const deptTreeQuery = useDeptTreeQuery(deptQuery)
const deptTree = computed(() => deptTreeQuery.data.value ?? [])

const expandedDeptIds = reactive(new Set<number>())
watch(statusFilter, () => {
  expandedDeptIds.clear()
})
watch(
  deptTree,
  (nodes) => {
    if (expandedDeptIds.size > 0) return
    const ids: number[] = []
    collectExpandableIds(nodes, ids)
    for (const id of ids) expandedDeptIds.add(id)
  },
  { immediate: true },
)

function toggleExpanded(id: number) {
  if (expandedDeptIds.has(id)) expandedDeptIds.delete(id)
  else expandedDeptIds.add(id)
}

function collectExpandableIds(nodes: DeptVO[], ids: number[]) {
  for (const node of nodes) {
    const id = node.id
    const children = Array.isArray(node.children) ? node.children : []
    if (typeof id === "number" && Number.isInteger(id) && id > 0 && children.length > 0)
      ids.push(id)
    if (children.length > 0) collectExpandableIds(children, ids)
  }
}

function expandAll() {
  const ids: number[] = []
  collectExpandableIds(deptTree.value, ids)
  for (const id of ids) expandedDeptIds.add(id)
}

function collapseAll() {
  expandedDeptIds.clear()
}

function filterTree(nodes: DeptVO[], key: string): DeptVO[] {
  if (!key) return nodes
  const output: DeptVO[] = []
  for (const node of nodes) {
    const children = Array.isArray(node.children) ? filterTree(node.children, key) : []
    const hit = (node.deptName ?? "").toLowerCase().includes(key)
    if (hit || children.length > 0) output.push({ ...node, children })
  }
  return output
}

const filteredTree = computed(() => filterTree(deptTree.value, keyword.value.trim().toLowerCase()))

const rows = computed<DeptRow[]>(() => {
  const out: DeptRow[] = []
  const forceExpand = Boolean(keyword.value.trim())

  const walk = (nodes: DeptVO[], level: number) => {
    for (const node of nodes) {
      const id = node.id
      if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) continue

      const children = Array.isArray(node.children) ? node.children : []
      const hasChildren = children.length > 0
      const isExpanded = forceExpand || expandedDeptIds.has(id)

      out.push({ id, level, node, hasChildren, isExpanded })

      if (hasChildren && isExpanded) walk(children, level + 1)
    }
  }

  walk(filteredTree.value, 0)
  return out
})

function deptIcon(node: DeptVO) {
  return typeof node.parentId === "number" && node.parentId > 0
    ? "radix-icons:dot-filled"
    : "radix-icons:home"
}

function leaderBadgeText(node: DeptVO) {
  const leader = (node.leader ?? "").trim()
  return leader ? leader.slice(0, 2) : "—"
}

function statusText(node: DeptVO) {
  return node.status === 1 ? "启用" : "停用"
}

function statusClass(node: DeptVO) {
  return node.status === 1 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
}

const deptStats = computed(() => {
  const topLevel = deptTree.value.length
  let total = 0

  const walk = (nodes: DeptVO[]) => {
    for (const node of nodes) {
      total += 1
      const children = Array.isArray(node.children) ? node.children : []
      if (children.length > 0) walk(children)
    }
  }
  walk(deptTree.value)

  return { topLevel, children: Math.max(0, total - topLevel) }
})

const createDeptMutation = useCreateDeptMutation()
const updateDeptMutation = useUpdateDeptMutation()
const deleteDeptMutation = useDeleteDeptMutation()

type DeptFormMode = "create" | "edit"
const isDeptFormOpen = ref(false)
const deptFormMode = ref<DeptFormMode>("create")

const deptForm = reactive({
  id: 0,
  parentId: 0,
  deptName: "",
  orderNum: "",
  leader: "",
  phone: "",
  email: "",
  status: "1",
})

const isDeptFormSubmitting = computed(
  () => createDeptMutation.isPending.value || updateDeptMutation.isPending.value,
)

function resetDeptForm() {
  deptForm.id = 0
  deptForm.parentId = 0
  deptForm.deptName = ""
  deptForm.orderNum = ""
  deptForm.leader = ""
  deptForm.phone = ""
  deptForm.email = ""
  deptForm.status = "1"
}

function openCreateDept(parent?: DeptVO) {
  deptFormMode.value = "create"
  resetDeptForm()
  const parentId = parent?.id
  deptForm.parentId =
    typeof parentId === "number" && Number.isInteger(parentId) && parentId > 0 ? parentId : 0
  isDeptFormOpen.value = true
}

function openEditDept(node: DeptVO) {
  const id = node.id
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    toast.error("部门ID无效，无法编辑")
    return
  }

  deptFormMode.value = "edit"
  deptForm.id = id
  deptForm.parentId = typeof node.parentId === "number" ? node.parentId : 0
  deptForm.deptName = node.deptName?.trim() ?? ""
  deptForm.orderNum = typeof node.orderNum === "number" ? String(node.orderNum) : ""
  deptForm.leader = node.leader?.trim() ?? ""
  deptForm.phone = node.phone?.trim() ?? ""
  deptForm.email = node.email?.trim() ?? ""
  deptForm.status = typeof node.status === "number" ? String(node.status) : "1"
  isDeptFormOpen.value = true
}

function closeDeptForm() {
  isDeptFormOpen.value = false
}

function toOptionalInt(value: string) {
  const text = value.trim()
  if (!text) return
  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return
  return Number.isInteger(parsed) ? parsed : Math.floor(parsed)
}

function buildCreatePayload(): DeptCreateRequest {
  return DeptCreateRequestSchema.parse({
    parentId: deptForm.parentId,
    deptName: deptForm.deptName.trim(),
    orderNum: toOptionalInt(deptForm.orderNum),
    leader: deptForm.leader.trim() || undefined,
    phone: deptForm.phone.trim() || undefined,
    email: deptForm.email.trim() || undefined,
    status: Number(deptForm.status),
  })
}

function buildUpdatePayload(): DeptUpdateRequest {
  return DeptUpdateRequestSchema.parse({
    id: deptForm.id,
    parentId: deptForm.parentId,
    deptName: deptForm.deptName.trim(),
    orderNum: toOptionalInt(deptForm.orderNum),
    leader: deptForm.leader.trim() || undefined,
    phone: deptForm.phone.trim() || undefined,
    email: deptForm.email.trim() || undefined,
    status: Number(deptForm.status),
  })
}

async function submitDeptForm() {
  try {
    if (deptFormMode.value === "create") {
      await createDeptMutation.mutateAsync(buildCreatePayload())
      toast.success("部门已创建")
    } else {
      await updateDeptMutation.mutateAsync(buildUpdatePayload())
      toast.success("部门已更新")
    }
    closeDeptForm()
  } catch (error) {
    console.error("[SystemDept] Failed to submit dept form:", error)
    toast.error("提交失败，请检查输入或稍后重试")
  }
}

const isDeleteConfirmOpen = ref(false)
const deleteTargetDeptId = ref<number | null>(null)

function requestDeleteDept(deptId: number) {
  deleteTargetDeptId.value = deptId
  isDeleteConfirmOpen.value = true
}

async function confirmDeleteDept() {
  const deptId = deleteTargetDeptId.value
  if (typeof deptId !== "number" || !Number.isInteger(deptId) || deptId <= 0) return

  isDeleteConfirmOpen.value = false
  deleteTargetDeptId.value = null

  try {
    await deleteDeptMutation.mutateAsync(deptId)
    toast.success("删除成功")
  } catch (error) {
    console.error("[SystemDept] Failed to delete dept:", error)
    toast.error("删除失败，请稍后重试")
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">部门管理</h1>
      <p class="text-[13px] text-muted-foreground">管理组织架构、部门层级关系</p>
    </div>

    <Card class="overflow-hidden">
      <CardHeader class="bg-muted/30 !p-4">
        <div class="flex flex-wrap items-center gap-2">
          <div class="w-full sm:w-[240px]">
            <Input v-model="keyword" placeholder="搜索部门名称..." />
          </div>

          <div class="w-full sm:w-[160px]">
            <Select v-model="statusFilter" :options="statusOptions" />
          </div>
          <Button type="button" variant="outline" @click="expandAll">展开全部</Button>
          <Button type="button" variant="outline" @click="collapseAll">收起全部</Button>

          <div class="flex-1" />

          <Button type="button" @click="openCreateDept()">+ 新增部门</Button>
          <Button type="button" variant="outline" @click="deptTreeQuery.refetch()">刷新</Button>
        </div>
      </CardHeader>

      <CardContent class="!p-0">
        <table class="w-full text-[13px]">
          <thead class="bg-muted/20 text-[12px] text-muted-foreground">
            <tr>
              <th class="p-3 text-left font-medium">部门名称</th>
              <th class="p-3 text-left font-medium">负责人</th>
              <th class="p-3 text-left font-medium">联系电话</th>
              <th class="p-3 text-left font-medium">邮箱</th>
              <th class="p-3 text-left font-medium">人数</th>
              <th class="p-3 text-left font-medium">排序</th>
              <th class="p-3 text-left font-medium">状态</th>
              <th class="p-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id" class="border-t hover:bg-accent/40">
              <td class="p-3">
                <div
                  class="flex items-center gap-2"
                  :style="{ paddingLeft: `${row.level * 20}px` }"
                >
                  <button
                    v-if="row.hasChildren"
                    type="button"
                    class="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                    :aria-label="row.isExpanded ? '收起' : '展开'"
                    @click="toggleExpanded(row.id)"
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
                    <AppIcon :icon="deptIcon(row.node)" class="h-4 w-4" />
                  </div>

                  <span class="font-semibold text-foreground">{{ row.node.deptName ?? "-" }}</span>
                </div>
              </td>

              <td class="p-3">
                <div class="flex items-center gap-2">
                  <div
                    class="grid size-8 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground"
                  >
                    {{ leaderBadgeText(row.node) }}
                  </div>
                  <span>{{ row.node.leader ?? "-" }}</span>
                </div>
              </td>

              <td class="p-3">{{ row.node.phone ?? "-" }}</td>
              <td class="p-3">{{ row.node.email ?? "-" }}</td>
              <td class="p-3">-</td>
              <td class="p-3">
                {{ typeof row.node.orderNum === "number" ? row.node.orderNum : "-" }}
              </td>
              <td class="p-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                  :class="statusClass(row.node)"
                >
                  {{ statusText(row.node) }}
                </span>
              </td>
              <td class="p-3">
                <div class="flex flex-wrap items-center gap-3 text-[12px]">
                  <button
                    type="button"
                    class="text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!(typeof row.node.id === 'number' && row.node.id > 0)"
                    @click="openEditDept(row.node)"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    class="text-green-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="!(typeof row.node.id === 'number' && row.node.id > 0)"
                    @click="openCreateDept(row.node)"
                  >
                    新增
                  </button>
                  <button
                    type="button"
                    class="text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                    :disabled="
                      !(typeof row.node.id === 'number' && row.node.id > 0) ||
                      deleteDeptMutation.isPending.value
                    "
                    @click="
                      typeof row.node.id === 'number' &&
                      row.node.id > 0 &&
                      requestDeleteDept(row.node.id)
                    "
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="rows.length === 0">
              <td colspan="8" class="p-6 text-center text-[13px] text-muted-foreground">
                {{ deptTreeQuery.isFetching.value ? "加载中..." : "暂无数据" }}
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>

      <CardContent class="!p-4 text-[12px] text-muted-foreground">
        共 {{ deptStats.topLevel }} 个一级部门，{{ deptStats.children }} 个子部门
      </CardContent>
    </Card>

    <div
      v-if="isDeptFormOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeDeptForm"
    >
      <Card class="w-full max-w-[560px] overflow-hidden">
        <CardHeader class="bg-muted/30 !p-4">
          <CardTitle class="text-base">{{
            deptFormMode === "create" ? "新增部门" : "编辑部门"
          }}</CardTitle>
        </CardHeader>

        <CardContent class="grid gap-4 !p-4">
          <div class="grid gap-2">
            <Label>父部门ID</Label>
            <div
              class="h-10 rounded-lg border border-input bg-muted/20 px-4 text-[13px] leading-[40px] text-muted-foreground"
            >
              {{ deptForm.parentId }}
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="dept-name">部门名称</Label>
            <Input
              id="dept-name"
              v-model="deptForm.deptName"
              :disabled="isDeptFormSubmitting"
              placeholder="请输入部门名称"
            />
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="dept-order">排序</Label>
              <Input
                id="dept-order"
                v-model="deptForm.orderNum"
                :disabled="isDeptFormSubmitting"
                placeholder="可选"
              />
            </div>
            <div class="grid gap-2">
              <Label>状态</Label>
              <div class="flex flex-wrap gap-4">
                <label class="inline-flex items-center gap-2 text-[13px]">
                  <input
                    v-model="deptForm.status"
                    type="radio"
                    value="1"
                    class="h-4 w-4 accent-primary"
                    :disabled="isDeptFormSubmitting"
                  />
                  启用
                </label>
                <label class="inline-flex items-center gap-2 text-[13px]">
                  <input
                    v-model="deptForm.status"
                    type="radio"
                    value="0"
                    class="h-4 w-4 accent-primary"
                    :disabled="isDeptFormSubmitting"
                  />
                  停用
                </label>
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="dept-leader">负责人</Label>
              <Input
                id="dept-leader"
                v-model="deptForm.leader"
                :disabled="isDeptFormSubmitting"
                placeholder="可选"
              />
            </div>
            <div class="grid gap-2">
              <Label for="dept-phone">联系电话</Label>
              <Input
                id="dept-phone"
                v-model="deptForm.phone"
                :disabled="isDeptFormSubmitting"
                placeholder="可选"
              />
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="dept-email">邮箱</Label>
            <Input
              id="dept-email"
              v-model="deptForm.email"
              :disabled="isDeptFormSubmitting"
              placeholder="可选"
            />
          </div>
        </CardContent>

        <CardContent class="flex flex-wrap justify-end gap-2 !p-4 !pt-0">
          <Button
            type="button"
            variant="outline"
            :disabled="isDeptFormSubmitting"
            @click="closeDeptForm"
          >
            取消
          </Button>
          <Button type="button" :disabled="isDeptFormSubmitting" @click="submitDeptForm">
            {{ isDeptFormSubmitting ? "保存中..." : "保存" }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <AlertDialog v-model:open="isDeleteConfirmOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除该部门？</AlertDialogTitle>
          <AlertDialogDescription>删除后不可恢复，请谨慎操作。</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="deleteDeptMutation.isPending.value">取消</AlertDialogCancel>
          <AlertDialogAction
            :disabled="deleteDeptMutation.isPending.value"
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            @click="confirmDeleteDept"
          >
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
