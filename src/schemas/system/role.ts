// {{RIPER-10 Action}}
// Role: LD | Task_ID: #system-role-api | Time: 2026-01-04T00:00:00+08:00
// Principle: Validate backend contracts at runtime.
// Taste: Minimal schemas that match the API doc and tolerate extras.

import { z } from "zod"

export const RoleQuerySchema = z
  .object({
    pageNum: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    orderBy: z.string().optional(),
    orderDirection: z.string().optional(),
    roleName: z.string().optional(),
    roleKey: z.string().optional(),
    status: z.number().int().optional(),
    beginTime: z.string().optional(),
    endTime: z.string().optional(),
    asc: z.boolean().optional(),
  })
  .passthrough()

export type RoleQuery = z.infer<typeof RoleQuerySchema>

export const RoleUpdateRequestSchema = z
  .object({
    id: z.number().int(),
    roleName: z.string().min(1),
    roleKey: z.string().min(1),
    orderNum: z.number().int().optional(),
    dataScope: z.number().int().optional(),
    status: z.number().int().optional(),
    remark: z.string().optional(),
    menuIds: z.array(z.number().int()).optional(),
    deptIds: z.array(z.number().int()).optional(),
  })
  .passthrough()

export type RoleUpdateRequest = z.infer<typeof RoleUpdateRequestSchema>

export const RoleVOSchema = z
  .object({
    id: z.number().int().optional(),
    createTime: z.string().optional(),
    createBy: z.number().int().optional(),
    updateTime: z.string().optional(),
    updateBy: z.number().int().optional(),
    deleted: z.number().int().optional(),
    version: z.number().int().optional(),
    roleName: z.string().optional(),
    roleKey: z.string().optional(),
    orderNum: z.number().int().optional(),
    dataScope: z.number().int().optional(),
    status: z.number().int().optional(),
    remark: z.string().optional(),
  })
  .passthrough()

export interface RoleVO extends z.infer<typeof RoleVOSchema> {}

export const PageResultRoleVOSchema = z
  .object({
    pageNum: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    total: z.number().int().optional(),
    pages: z.number().int().optional(),
    records: z.array(RoleVOSchema).optional(),
  })
  .passthrough()

export type PageResultRoleVO = z.infer<typeof PageResultRoleVOSchema>
