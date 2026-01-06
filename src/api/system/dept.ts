import { z } from "zod"

import {
  DeptCreateRequestSchema,
  DeptUpdateRequestSchema,
  DeptVOSchema,
  TreeSelectVOSchema,
  type DeptCreateRequest,
  type DeptQuery,
  type DeptUpdateRequest,
  type DeptVO,
  type TreeSelectVO,
} from "@/schemas/system/dept"
import request from "@/utils/request"

export async function listDeptTree(query: DeptQuery = {}): Promise<DeptVO[]> {
  const data = await request.get<unknown>("/system/dept/list", { params: query })
  return z.array(DeptVOSchema).parse(data)
}

export async function listDeptTreeSelect(query: DeptQuery = {}): Promise<TreeSelectVO[]> {
  const data = await request.get<unknown>("/system/dept/treeselect", { params: query })
  return z.array(TreeSelectVOSchema).parse(data)
}

export async function getDeptDetail(deptId: number): Promise<DeptVO> {
  const data = await request.get<unknown>(`/system/dept/${deptId}`)
  return DeptVOSchema.parse(data)
}

export async function createDept(payload: DeptCreateRequest): Promise<number> {
  DeptCreateRequestSchema.parse(payload)
  const data = await request.post<unknown>("/system/dept", payload)
  return z.number().int().parse(data)
}

export async function updateDept(payload: DeptUpdateRequest): Promise<void> {
  DeptUpdateRequestSchema.parse(payload)
  await request.put("/system/dept", payload)
}

export async function deleteDept(deptId: number): Promise<void> {
  await request.delete(`/system/dept/${deptId}`)
}
