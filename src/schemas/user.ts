// {{RIPER-10 Action}}
// Role: LD | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
// Principle: Runtime validation is part of the contract.
// Taste: Keep schemas close to the domain and export inferred types.

import { z } from "zod"

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
})

export type User = z.infer<typeof UserSchema>
