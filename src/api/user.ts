// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Keep API functions thin and typed.
// Taste: Parse server data with Zod at the boundary.

import { UserSchema, type User } from "@/schemas/user"
import request from "@/utils/request"

export async function fetchUserInfo(id: string): Promise<User> {
  const data = await request.get<unknown>(`/user/${id}`)
  return UserSchema.parse(data)
}
