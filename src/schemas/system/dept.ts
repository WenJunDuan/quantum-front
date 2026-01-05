// {{RIPER-10 Action}}
// Role: LD | Task_ID: #system-dept-api | Time: 2026-01-04T00:00:00+08:00
// Principle: Validate backend contracts at runtime.
// Taste: Minimal schemas that match the API doc and tolerate extras.

import { z } from "zod"

export const DeptQuerySchema = z
  .object({
    deptName: z.string().optional(),
    status: z.number().int().optional(),
  })
  .passthrough()

export type DeptQuery = z.infer<typeof DeptQuerySchema>

export const DeptCreateRequestSchema = z
  .object({
    parentId: z.number().int().optional(),
    deptName: z.string().min(1),
    orderNum: z.number().int().optional(),
    leader: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    status: z.number().int().optional(),
  })
  .passthrough()

export type DeptCreateRequest = z.infer<typeof DeptCreateRequestSchema>

export const DeptUpdateRequestSchema = DeptCreateRequestSchema.extend({
  id: z.number().int(),
})

export type DeptUpdateRequest = z.infer<typeof DeptUpdateRequestSchema>

export interface DeptVO extends z.infer<typeof DeptVOSchema> {}

export const DeptVOSchema: z.ZodType<{
  id?: number
  createTime?: string
  createBy?: number
  updateTime?: string
  updateBy?: number
  deleted?: number
  version?: number
  deptName?: string
  parentId?: number
  ancestors?: string
  orderNum?: number
  leader?: string
  phone?: string
  email?: string
  status?: number
  children?: DeptVO[]
}> = z.lazy(() =>
  z
    .object({
      id: z.number().int().optional(),
      createTime: z.string().optional(),
      createBy: z.number().int().optional(),
      updateTime: z.string().optional(),
      updateBy: z.number().int().optional(),
      deleted: z.number().int().optional(),
      version: z.number().int().optional(),
      deptName: z.string().optional(),
      parentId: z.number().int().optional(),
      ancestors: z.string().optional(),
      orderNum: z.number().int().optional(),
      leader: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      status: z.number().int().optional(),
      children: z.array(DeptVOSchema).optional(),
    })
    .passthrough(),
)

export interface TreeSelectVO extends z.infer<typeof TreeSelectVOSchema> {}

export const TreeSelectVOSchema: z.ZodType<{
  id?: number
  label?: string
  children?: TreeSelectVO[]
}> = z.lazy(() =>
  z
    .object({
      id: z.number().int().optional(),
      label: z.string().optional(),
      children: z.array(TreeSelectVOSchema).optional(),
    })
    .passthrough(),
)
