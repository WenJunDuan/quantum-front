// {{RIPER-10 Action}}
// Role: LD | Task_ID: #system-user-api | Time: 2026-01-04T00:00:00+08:00
// Principle: Keep API wrappers small and type-safe.
// Taste: Parse with zod before reaching components.

import { z } from "zod"

import {
  PageResultUserVOSchema,
  UserCreateRequestSchema,
  UserUpdateRequestSchema,
  UserVOSchema,
  type PageResultUserVO,
  type UserCreateRequest,
  type UserQuery,
  type UserUpdateRequest,
  type UserVO,
} from "@/schemas/system/user"
import request from "@/utils/request"

export async function listUserPage(query: UserQuery = {}): Promise<PageResultUserVO> {
  const data = await request.get<unknown>("/system/user/list", { params: query })
  return PageResultUserVOSchema.parse(data)
}

export async function getUserDetail(userId: number): Promise<UserVO> {
  const data = await request.get<unknown>(`/system/user/${userId}`)
  return UserVOSchema.parse(data)
}

export async function createUser(payload: UserCreateRequest): Promise<number> {
  UserCreateRequestSchema.parse(payload)
  const data = await request.post<unknown>("/system/user", payload)
  return z.number().int().parse(data)
}

export async function updateUser(payload: UserUpdateRequest): Promise<void> {
  UserUpdateRequestSchema.parse(payload)
  await request.put("/system/user", payload)
}

export async function deleteUsers(userIds: number[]): Promise<void> {
  const ids = userIds.filter((id) => typeof id === "number" && Number.isInteger(id) && id > 0)
  if (ids.length === 0) throw new Error("[SystemUser] userIds is required")
  await request.delete(`/system/user/${ids.join(",")}`)
}
