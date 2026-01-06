import { z } from "zod"

export const UserQuerySchema = z
  .object({
    pageNum: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    orderBy: z.string().optional(),
    orderDirection: z.string().optional(),
    username: z.string().optional(),
    nickname: z.string().optional(),
    phone: z.string().optional(),
    deptId: z.number().int().optional(),
    status: z.number().int().optional(),
    beginTime: z.string().optional(),
    endTime: z.string().optional(),
    asc: z.boolean().optional(),
  })
  .passthrough()

export type UserQuery = z.infer<typeof UserQuerySchema>

export const UserCreateRequestSchema = z
  .object({
    username: z.string().min(1),
    password: z.string().min(1),
    nickname: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().optional(),
    sex: z.number().int().optional(),
    deptId: z.number().int().optional(),
    status: z.number().int().optional(),
    roleIds: z.array(z.number().int()).optional(),
    remark: z.string().optional(),
  })
  .passthrough()

export type UserCreateRequest = z.infer<typeof UserCreateRequestSchema>

export const UserUpdateRequestSchema = z
  .object({
    id: z.number().int(),
    nickname: z.string().min(1),
    phone: z.string().optional(),
    email: z.string().optional(),
    sex: z.number().int().optional(),
    deptId: z.number().int().optional(),
    status: z.number().int().optional(),
    roleIds: z.array(z.number().int()).optional(),
    remark: z.string().optional(),
  })
  .passthrough()

export type UserUpdateRequest = z.infer<typeof UserUpdateRequestSchema>

export const UserVOSchema = z
  .object({
    id: z.number().int().optional(),
    createTime: z.string().optional(),
    createBy: z.number().int().optional(),
    updateTime: z.string().optional(),
    updateBy: z.number().int().optional(),
    deleted: z.number().int().optional(),
    version: z.number().int().optional(),
    username: z.string().optional(),
    nickname: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    sex: z.number().int().optional(),
    deptName: z.string().optional(),
    status: z.number().int().optional(),
    loginIp: z.string().optional(),
    loginDate: z.string().optional(),
    remark: z.string().optional(),
    roles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
  })
  .passthrough()

export interface UserVO extends z.infer<typeof UserVOSchema> {}

export const PageResultUserVOSchema = z
  .object({
    pageNum: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    total: z.number().int().optional(),
    pages: z.number().int().optional(),
    records: z.array(UserVOSchema).optional(),
  })
  .passthrough()

export type PageResultUserVO = z.infer<typeof PageResultUserVOSchema>
