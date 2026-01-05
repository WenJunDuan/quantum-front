// {{RIPER-10 Action}}
// Role: LD | Task_ID: #system-role-api | Time: 2026-01-04T00:00:00+08:00
// Principle: Keep API wrappers small and type-safe.
// Taste: Parse with zod before reaching components.

import { z } from "zod"

import {
  PageResultRoleVOSchema,
  RoleUpdateRequestSchema,
  RoleVOSchema,
  type PageResultRoleVO,
  type RoleQuery,
  type RoleUpdateRequest,
  type RoleVO,
} from "@/schemas/system/role"
import request from "@/utils/request"

export async function listRolePage(query: RoleQuery = {}): Promise<PageResultRoleVO> {
  const data = await request.get<unknown>("/system/role/list", { params: query })
  return PageResultRoleVOSchema.parse(data)
}

export async function getRoleDetail(roleId: number): Promise<RoleVO> {
  const data = await request.get<unknown>(`/system/role/${roleId}`)
  return RoleVOSchema.parse(data)
}

export async function getRoleMenuIds(roleId: number): Promise<number[]> {
  const data = await request.get<unknown>(`/system/role/${roleId}/menus`)
  return z.array(z.number().int()).parse(data)
}

export async function updateRole(payload: RoleUpdateRequest): Promise<void> {
  RoleUpdateRequestSchema.parse(payload)
  await request.put("/system/role", payload)
}
