<!-- {{RIPER-10 Action}}
Role: LD | Task_ID: #system-dict-page | Time: 2026-01-04T00:00:00+08:00
Principle: Dictionary is (Type -> Items); keep structures separate.
Taste: Left type list + right item table + clear empty state.
-->

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue"

import AppPagination from "@/components/app-pagination"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  useCreateDictDataMutation,
  useCreateDictTypeMutation,
  useDeleteDictDataMutation,
  useDeleteDictTypesMutation,
  useDictDataPageQuery,
  useDictTypePageQuery,
  useUpdateDictDataMutation,
  useUpdateDictTypeMutation,
} from "@/queries/system/dict"
import {
  DictDataCreateRequestSchema,
  DictDataUpdateRequestSchema,
  DictTypeCreateRequestSchema,
  DictTypeUpdateRequestSchema,
  type DictDataCreateRequest,
  type DictDataQuery,
  type DictDataUpdateRequest,
  type DictDataVO,
  type DictTypeCreateRequest,
  type DictTypeQuery,
  type DictTypeUpdateRequest,
  type DictTypeVO,
} from "@/schemas/system/dict"
import { useNotifyStore } from "@/stores/notify"

function isKeyLike(value: string) {
  return /^[a-z0-9:_-]+$/i.test(value)
}

const typeKeyword = ref("")
const selectedTypeId = ref<number | null>(null)
const itemKeyword = ref("")
const dataStatusFilter = ref<"" | "1" | "0">("")
const notify = useNotifyStore()

const statusOptions = [
  { label: "全部状态", value: "" },
  { label: "启用", value: "1" },
  { label: "停用", value: "0" },
]

const dictTypeQuery = computed<DictTypeQuery>(() => {
  const keyword = typeKeyword.value.trim()
  const keyLike = keyword && isKeyLike(keyword)

  return {
    pageNum: 1,
    pageSize: 50,
    ...(keyword ? (keyLike ? { dictType: keyword } : { dictName: keyword }) : {}),
  }
})

const dictTypePageQuery = useDictTypePageQuery(dictTypeQuery)
const dictTypes = computed(() => dictTypePageQuery.data.value?.records ?? [])

watch(
  dictTypes,
  (rows) => {
    const currentId = selectedTypeId.value
    if (currentId && rows.some((row) => row.id === currentId)) return
    const first = rows.find((r) => typeof r.id === "number" && r.id > 0)
    selectedTypeId.value = first?.id ?? null
  },
  { immediate: true },
)

const selectedType = computed<DictTypeVO | null>(() => {
  const id = selectedTypeId.value
  if (!id) return null
  return dictTypes.value.find((t) => t.id === id) ?? null
})

function selectType(typeId: number) {
  selectedTypeId.value = typeId
}

const selectedDictType = computed(() => selectedType.value?.dictType?.trim() || null)
const dataPageNum = ref(1)
const dataPageSize = ref(10)

watch([selectedTypeId, itemKeyword, dataStatusFilter], () => {
  dataPageNum.value = 1
})

const dictDataQuery = computed<DictDataQuery>(() => ({
  pageNum: dataPageNum.value,
  pageSize: dataPageSize.value,
  dictType: selectedDictType.value ?? undefined,
  ...(dataStatusFilter.value === "" ? {} : { status: Number(dataStatusFilter.value) }),
  ...(itemKeyword.value.trim() ? { dictLabel: itemKeyword.value.trim() } : {}),
}))

const dictDataPageQuery = useDictDataPageQuery(dictDataQuery)
const dictDataRows = computed(() => dictDataPageQuery.data.value ?? [])

const canNextDataPage = computed(() => {
  if (!selectedType.value) return false
  if (dictDataPageQuery.isFetching.value) return false
  return dictDataRows.value.length >= dataPageSize.value
})

const createTypeMutation = useCreateDictTypeMutation()
const updateTypeMutation = useUpdateDictTypeMutation()
const deleteTypesMutation = useDeleteDictTypesMutation()

const createDataMutation = useCreateDictDataMutation()
const updateDataMutation = useUpdateDictDataMutation()
const deleteDataMutation = useDeleteDictDataMutation()

type DictTypeFormMode = "create" | "edit"
const isTypeFormOpen = ref(false)
const typeFormMode = ref<DictTypeFormMode>("create")
const typeForm = reactive({
  id: 0,
  dictName: "",
  dictType: "",
  status: "1",
  remark: "",
})

const isTypeFormSubmitting = computed(
  () => createTypeMutation.isPending.value || updateTypeMutation.isPending.value,
)

function resetTypeForm() {
  typeForm.id = 0
  typeForm.dictName = ""
  typeForm.dictType = ""
  typeForm.status = "1"
  typeForm.remark = ""
}

function openCreateType() {
  typeFormMode.value = "create"
  resetTypeForm()
  isTypeFormOpen.value = true
}

function openEditType(row: DictTypeVO) {
  const id = row.id
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    notify.error("字典类型ID无效，无法编辑")
    return
  }
  typeFormMode.value = "edit"
  typeForm.id = id
  typeForm.dictName = row.dictName?.trim() ?? ""
  typeForm.dictType = row.dictType?.trim() ?? ""
  typeForm.status = typeof row.status === "number" ? String(row.status) : "1"
  typeForm.remark = row.remark?.trim() ?? ""
  isTypeFormOpen.value = true
}

function closeTypeForm() {
  isTypeFormOpen.value = false
}

function buildCreateTypePayload(): DictTypeCreateRequest {
  return DictTypeCreateRequestSchema.parse({
    dictName: typeForm.dictName.trim(),
    dictType: typeForm.dictType.trim(),
    status: Number(typeForm.status),
    remark: typeForm.remark.trim() || undefined,
  })
}

function buildUpdateTypePayload(): DictTypeUpdateRequest {
  return DictTypeUpdateRequestSchema.parse({
    id: typeForm.id,
    dictName: typeForm.dictName.trim(),
    dictType: typeForm.dictType.trim(),
    status: Number(typeForm.status),
    remark: typeForm.remark.trim() || undefined,
  })
}

async function submitTypeForm() {
  try {
    if (typeFormMode.value === "create") {
      const id = await createTypeMutation.mutateAsync(buildCreateTypePayload())
      selectedTypeId.value = id
      notify.success("字典类型已创建")
    } else {
      await updateTypeMutation.mutateAsync(buildUpdateTypePayload())
      notify.success("字典类型已更新")
    }
    closeTypeForm()
  } catch (error) {
    console.error("[SystemDict] Failed to submit dict type:", error)
    notify.error("提交失败，请检查输入或稍后重试")
  }
}

async function deleteDictType(row: DictTypeVO) {
  const id = row.id
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) return
  if (!globalThis.confirm("确认删除该字典类型？")) return
  try {
    await deleteTypesMutation.mutateAsync([id])
    if (selectedTypeId.value === id) selectedTypeId.value = null
    notify.success("删除成功")
  } catch (error) {
    console.error("[SystemDict] Failed to delete dict type:", error)
    notify.error("删除失败，请稍后重试")
  }
}

type DictDataFormMode = "create" | "edit"
const isDataFormOpen = ref(false)
const dataFormMode = ref<DictDataFormMode>("create")
const dataForm = reactive({
  id: 0,
  dictType: "",
  dictLabel: "",
  dictValue: "",
  dictSort: "",
  listClass: "",
  status: "1",
  remark: "",
})

const isDataFormSubmitting = computed(
  () => createDataMutation.isPending.value || updateDataMutation.isPending.value,
)

function resetDataForm() {
  dataForm.id = 0
  dataForm.dictType = selectedDictType.value ?? ""
  dataForm.dictLabel = ""
  dataForm.dictValue = ""
  dataForm.dictSort = ""
  dataForm.listClass = ""
  dataForm.status = "1"
  dataForm.remark = ""
}

function openCreateData() {
  if (!selectedType.value) return
  dataFormMode.value = "create"
  resetDataForm()
  isDataFormOpen.value = true
}

function openEditData(row: DictDataVO) {
  const id = row.id
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    notify.error("字典数据ID无效，无法编辑")
    return
  }
  dataFormMode.value = "edit"
  dataForm.id = id
  dataForm.dictType = row.dictType?.trim() ?? selectedDictType.value ?? ""
  dataForm.dictLabel = row.dictLabel?.trim() ?? ""
  dataForm.dictValue = row.dictValue?.trim() ?? ""
  dataForm.dictSort = typeof row.dictSort === "number" ? String(row.dictSort) : ""
  dataForm.listClass = row.listClass?.trim() ?? ""
  dataForm.status = typeof row.status === "number" ? String(row.status) : "1"
  dataForm.remark = row.remark?.trim() ?? ""
  isDataFormOpen.value = true
}

function closeDataForm() {
  isDataFormOpen.value = false
}

function toOptionalInt(value: string) {
  const text = value.trim()
  if (!text) return
  const parsed = Number(text)
  if (!Number.isFinite(parsed)) return
  return Number.isInteger(parsed) ? parsed : Math.floor(parsed)
}

function buildCreateDataPayload(): DictDataCreateRequest {
  return DictDataCreateRequestSchema.parse({
    dictType: dataForm.dictType.trim(),
    dictLabel: dataForm.dictLabel.trim(),
    dictValue: dataForm.dictValue.trim(),
    dictSort: toOptionalInt(dataForm.dictSort),
    listClass: dataForm.listClass.trim() || undefined,
    status: Number(dataForm.status),
    remark: dataForm.remark.trim() || undefined,
  })
}

function buildUpdateDataPayload(): DictDataUpdateRequest {
  return DictDataUpdateRequestSchema.parse({
    id: dataForm.id,
    dictType: dataForm.dictType.trim(),
    dictLabel: dataForm.dictLabel.trim(),
    dictValue: dataForm.dictValue.trim(),
    dictSort: toOptionalInt(dataForm.dictSort),
    listClass: dataForm.listClass.trim() || undefined,
    status: Number(dataForm.status),
    remark: dataForm.remark.trim() || undefined,
  })
}

async function submitDataForm() {
  try {
    if (dataFormMode.value === "create") {
      await createDataMutation.mutateAsync(buildCreateDataPayload())
      notify.success("字典数据已创建")
    } else {
      await updateDataMutation.mutateAsync(buildUpdateDataPayload())
      notify.success("字典数据已更新")
    }
    closeDataForm()
  } catch (error) {
    console.error("[SystemDict] Failed to submit dict data:", error)
    notify.error("提交失败，请检查输入或稍后重试")
  }
}

async function deleteDictDataRow(row: DictDataVO) {
  const id = row.id
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) return
  if (!globalThis.confirm("确认删除该字典数据？")) return
  try {
    await deleteDataMutation.mutateAsync([id])
    notify.success("删除成功")
  } catch (error) {
    console.error("[SystemDict] Failed to delete dict data:", error)
    notify.error("删除失败，请稍后重试")
  }
}

function tagClassByListClass(value?: string) {
  const text = typeof value === "string" ? value.trim().toLowerCase() : ""
  if (!text) return "bg-muted text-muted-foreground"

  if (text.includes("primary") || text.includes("info") || text.includes("blue"))
    return "bg-blue-100 text-blue-700"
  if (text.includes("success") || text.includes("green")) return "bg-green-100 text-green-700"
  if (text.includes("warning") || text.includes("orange")) return "bg-orange-100 text-orange-700"
  if (text.includes("danger") || text.includes("red")) return "bg-red-100 text-red-700"
  if (text.includes("purple")) return "bg-purple-100 text-purple-700"

  return "bg-muted text-muted-foreground"
}

function statusText(status?: number) {
  if (status === 1) return "启用"
  if (status === 0) return "停用"
  return "-"
}

function statusClass(status?: number) {
  if (status === 1) return "bg-green-100 text-green-700"
  if (status === 0) return "bg-red-100 text-red-700"
  return "bg-muted text-muted-foreground"
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">字典管理</h1>
      <p class="text-[13px] text-muted-foreground">维护系统数据字典、枚举值配置</p>
    </div>

    <div class="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
      <Card class="overflow-hidden">
        <CardHeader
          class="flex flex-col gap-3 bg-muted/30 !p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-2">
            <CardTitle class="text-base">字典类型</CardTitle>
          </div>
          <Button type="button" size="sm" @click="openCreateType">+ 新增</Button>
        </CardHeader>

        <CardContent class="grid gap-3 !p-4">
          <div class="flex flex-wrap items-center gap-2">
            <div class="min-w-[200px] flex-1">
              <Input v-model="typeKeyword" placeholder="搜索字典名称/编码..." />
            </div>
          </div>
        </CardContent>

        <CardContent class="max-h-[70dvh] overflow-auto p-2">
          <ul class="space-y-1">
            <li v-for="t in dictTypes" :key="t.id ?? t.dictType ?? t.dictName">
              <div
                role="button"
                tabindex="0"
                class="rounded-lg px-3 py-3 transition-colors hover:bg-accent/60"
                :class="[
                  selectedTypeId === t.id
                    ? 'bg-accent text-foreground shadow-sm'
                    : 'text-foreground',
                ]"
                @click="typeof t.id === 'number' && t.id > 0 && selectType(t.id)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex flex-wrap items-center gap-2">
                      <div class="truncate text-[13px] font-semibold">{{ t.dictName ?? "-" }}</div>
                      <span
                        class="rounded-md bg-muted px-2 py-0.5 font-mono text-[12px] text-primary/80"
                      >
                        {{ t.dictType ?? "-" }}
                      </span>
                    </div>
                    <div class="mt-1 truncate text-[12px] text-muted-foreground">
                      {{ t.remark ?? "-" }}
                    </div>
                  </div>

                  <div class="flex flex-col items-center gap-2 text-[12px]">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                      :class="statusClass(t.status)"
                    >
                      {{ statusText(t.status) }}
                    </span>
                    <div class="flex items-center justify-center gap-3">
                      <button
                        type="button"
                        class="text-primary hover:underline"
                        @click.stop="openEditType(t)"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        class="text-destructive hover:underline"
                        @click.stop="deleteDictType(t)"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <div class="w-full sm:w-[240px]">
            <Input
              v-model="itemKeyword"
              :disabled="!selectedType"
              placeholder="搜索字典标签/值..."
            />
          </div>
          <div class="w-full sm:w-[160px]">
            <Select v-model="dataStatusFilter" :options="statusOptions" :disabled="!selectedType" />
          </div>
          <div class="flex-1" />
          <Button type="button" :disabled="!selectedType" @click="openCreateData"
            >+ 新增数据</Button
          >
          <Button type="button" variant="outline" :disabled="!selectedType">导出</Button>
        </div>

        <Card v-if="selectedType" class="overflow-hidden">
          <CardHeader class="bg-muted/30 !p-4">
            <div class="flex flex-wrap items-center gap-2">
              <CardTitle class="text-base">{{ selectedType.dictName ?? "-" }}</CardTitle>
              <span class="rounded-md bg-muted px-2 py-0.5 font-mono text-[12px] text-primary/80">
                {{ selectedType.dictType ?? "-" }}
              </span>
            </div>
          </CardHeader>

          <CardContent class="!p-0">
            <table class="w-full text-[13px]">
              <thead class="bg-muted/20 text-[12px] text-muted-foreground">
                <tr>
                  <th class="p-3 text-left font-medium">字典标签</th>
                  <th class="p-3 text-left font-medium">字典键值</th>
                  <th class="p-3 text-left font-medium">样式预览</th>
                  <th class="p-3 text-left font-medium">排序</th>
                  <th class="p-3 text-left font-medium">状态</th>
                  <th class="p-3 text-left font-medium">备注</th>
                  <th class="p-3 text-left font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in dictDataRows"
                  :key="row.id ?? row.dictValue ?? row.dictLabel"
                  class="border-t hover:bg-accent/40"
                >
                  <td class="p-3">{{ row.dictLabel ?? "-" }}</td>
                  <td class="p-3">
                    <span
                      class="rounded-md bg-muted px-2 py-0.5 font-mono text-[12px] text-primary/80"
                    >
                      {{ row.dictValue ?? "-" }}
                    </span>
                  </td>
                  <td class="p-3">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                      :class="tagClassByListClass(row.listClass)"
                    >
                      {{ row.dictLabel ?? "-" }}
                    </span>
                  </td>
                  <td class="p-3">{{ typeof row.dictSort === "number" ? row.dictSort : "-" }}</td>
                  <td class="p-3">
                    <span
                      class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                      :class="statusClass(row.status)"
                    >
                      {{ statusText(row.status) }}
                    </span>
                  </td>
                  <td class="p-3">{{ row.remark ?? "-" }}</td>
                  <td class="p-3">
                    <div class="flex items-center gap-3 text-[12px]">
                      <button
                        type="button"
                        class="text-primary hover:underline"
                        @click="openEditData(row)"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        class="text-destructive hover:underline"
                        @click="deleteDictDataRow(row)"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>

                <tr v-if="dictDataRows.length === 0">
                  <td colspan="7" class="p-6 text-center text-[13px] text-muted-foreground">
                    {{ dictDataPageQuery.isFetching.value ? "加载中..." : "暂无数据" }}
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div v-else class="rounded-lg bg-muted/20 p-10 text-center">
          <div class="text-5xl opacity-40">📋</div>
          <div class="mt-3 text-[13px] text-muted-foreground">请从左侧选择字典类型</div>
          <div class="mt-1 text-[12px] text-muted-foreground">选择后将显示对应的字典数据</div>
        </div>

        <AppPagination
          v-if="selectedType"
          :total="dictDataRows.length"
          total-label="本页"
          :page-num="dataPageNum"
          :page-size="dataPageSize"
          :disabled="dictDataPageQuery.isFetching.value"
          :has-next="canNextDataPage"
          :show-total-pages="false"
          @update:page-num="dataPageNum = $event"
          @update:page-size="dataPageSize = $event"
        />
      </div>
    </div>

    <div
      v-if="isTypeFormOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeTypeForm"
    >
      <Card class="w-full max-w-[560px] overflow-hidden">
        <CardHeader class="bg-muted/30 !p-4">
          <CardTitle class="text-base">{{
            typeFormMode === "create" ? "新增字典类型" : "编辑字典类型"
          }}</CardTitle>
        </CardHeader>

        <CardContent class="grid gap-4 !p-4">
          <div class="grid gap-2">
            <Label for="dict-type-name">字典名称</Label>
            <Input
              id="dict-type-name"
              v-model="typeForm.dictName"
              :disabled="isTypeFormSubmitting"
              placeholder="请输入字典名称"
            />
          </div>
          <div class="grid gap-2">
            <Label for="dict-type-key">字典类型</Label>
            <Input
              id="dict-type-key"
              v-model="typeForm.dictType"
              :disabled="isTypeFormSubmitting || typeFormMode === 'edit'"
              placeholder="例如：sys_user_sex"
            />
          </div>

          <div class="grid gap-2">
            <Label>状态</Label>
            <div class="flex flex-wrap gap-4">
              <label class="inline-flex items-center gap-2 text-[13px]">
                <input
                  v-model="typeForm.status"
                  type="radio"
                  value="1"
                  class="h-4 w-4 accent-primary"
                  :disabled="isTypeFormSubmitting"
                />
                启用
              </label>
              <label class="inline-flex items-center gap-2 text-[13px]">
                <input
                  v-model="typeForm.status"
                  type="radio"
                  value="0"
                  class="h-4 w-4 accent-primary"
                  :disabled="isTypeFormSubmitting"
                />
                停用
              </label>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="dict-type-remark">备注</Label>
            <textarea
              id="dict-type-remark"
              v-model="typeForm.remark"
              :disabled="isTypeFormSubmitting"
              class="min-h-[96px] w-full rounded-lg border border-input bg-background/55 px-4 py-2 text-[13px] shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="可选"
            />
          </div>
        </CardContent>

        <CardContent class="flex flex-wrap justify-end gap-2 !p-4 !pt-0">
          <Button
            type="button"
            variant="outline"
            :disabled="isTypeFormSubmitting"
            @click="closeTypeForm"
          >
            取消
          </Button>
          <Button type="button" :disabled="isTypeFormSubmitting" @click="submitTypeForm">
            {{ isTypeFormSubmitting ? "保存中..." : "保存" }}
          </Button>
        </CardContent>
      </Card>
    </div>

    <div
      v-if="isDataFormOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="closeDataForm"
    >
      <Card class="w-full max-w-[640px] overflow-hidden">
        <CardHeader class="bg-muted/30 !p-4">
          <CardTitle class="text-base">{{
            dataFormMode === "create" ? "新增字典数据" : "编辑字典数据"
          }}</CardTitle>
        </CardHeader>

        <CardContent class="grid gap-4 !p-4">
          <div class="grid gap-2">
            <Label>字典类型</Label>
            <div
              class="h-10 rounded-lg border border-input bg-muted/20 px-4 text-[13px] leading-[40px] text-muted-foreground"
            >
              {{ dataForm.dictType }}
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="dict-data-label">字典标签</Label>
              <Input
                id="dict-data-label"
                v-model="dataForm.dictLabel"
                :disabled="isDataFormSubmitting"
                placeholder="例如：男"
              />
            </div>
            <div class="grid gap-2">
              <Label for="dict-data-value">字典键值</Label>
              <Input
                id="dict-data-value"
                v-model="dataForm.dictValue"
                :disabled="isDataFormSubmitting"
                placeholder="例如：0"
              />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="dict-data-sort">排序</Label>
              <Input
                id="dict-data-sort"
                v-model="dataForm.dictSort"
                :disabled="isDataFormSubmitting"
                placeholder="可选"
              />
            </div>
            <div class="grid gap-2">
              <Label for="dict-data-class">样式(listClass)</Label>
              <Input
                id="dict-data-class"
                v-model="dataForm.listClass"
                :disabled="isDataFormSubmitting"
                placeholder="例如：primary/success/warning"
              />
            </div>
          </div>

          <div class="grid gap-2">
            <Label>状态</Label>
            <div class="flex flex-wrap gap-4">
              <label class="inline-flex items-center gap-2 text-[13px]">
                <input
                  v-model="dataForm.status"
                  type="radio"
                  value="1"
                  class="h-4 w-4 accent-primary"
                  :disabled="isDataFormSubmitting"
                />
                启用
              </label>
              <label class="inline-flex items-center gap-2 text-[13px]">
                <input
                  v-model="dataForm.status"
                  type="radio"
                  value="0"
                  class="h-4 w-4 accent-primary"
                  :disabled="isDataFormSubmitting"
                />
                停用
              </label>
            </div>
          </div>

          <div class="grid gap-2">
            <Label for="dict-data-remark">备注</Label>
            <textarea
              id="dict-data-remark"
              v-model="dataForm.remark"
              :disabled="isDataFormSubmitting"
              class="min-h-[96px] w-full rounded-lg border border-input bg-background/55 px-4 py-2 text-[13px] shadow-sm backdrop-blur-sm backdrop-saturate-150 transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="可选"
            />
          </div>
        </CardContent>

        <CardContent class="flex flex-wrap justify-end gap-2 !p-4 !pt-0">
          <Button
            type="button"
            variant="outline"
            :disabled="isDataFormSubmitting"
            @click="closeDataForm"
          >
            取消
          </Button>
          <Button type="button" :disabled="isDataFormSubmitting" @click="submitDataForm">
            {{ isDataFormSubmitting ? "保存中..." : "保存" }}
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
