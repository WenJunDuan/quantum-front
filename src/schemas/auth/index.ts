import { z } from "zod"

export const CaptchaResultSchema = z.object({
  key: z.string().min(1),
  image: z.string().min(1),
  length: z.number().int().positive(),
})

export type CaptchaResult = z.infer<typeof CaptchaResultSchema>

export const LoginResponseSchema = z
  .object({
    userId: z.number().int().optional(),
    username: z.string().min(1).optional(),
    nickname: z.string().min(1).optional(),
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1).optional(),
    expireTime: z.string().min(1).optional(),
  })
  .passthrough()

export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const RouterMetaSchema = z
  .object({
    title: z.string().optional(),
    icon: z.string().optional(),
    noCache: z.boolean().optional(),
    requiresAuth: z.boolean().optional(),
    permission: z.string().optional(),
    roles: z.array(z.string()).optional(),
    link: z.string().optional(),
  })
  .passthrough()

export type RouterMeta = z.infer<typeof RouterMetaSchema>

export interface RouterVO extends z.infer<typeof RouterVOSchema> {}

export const RouterVOSchema: z.ZodType<{
  name?: string
  path: string
  hidden?: boolean
  redirect?: string
  component?: string
  query?: string
  alwaysShow?: boolean
  meta?: RouterMeta
  children?: RouterVO[]
}> = z.lazy(() =>
  z
    .object({
      name: z.string().optional(),
      path: z.string().min(1),
      hidden: z.boolean().optional(),
      redirect: z.string().optional(),
      component: z.string().optional(),
      query: z.string().optional(),
      alwaysShow: z.boolean().optional(),
      meta: RouterMetaSchema.optional(),
      children: z.array(RouterVOSchema).optional(),
    })
    .passthrough(),
)

export const UserInfoSchema = z
  .object({
    username: z.string().optional(),
    nickname: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    sex: z.number().int().optional(),
    deptName: z.string().optional(),
    status: z.number().int().optional(),
    loginIp: z.string().optional(),
    remark: z.string().optional(),
    roles: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    routers: z.array(RouterVOSchema).optional(),
  })
  .passthrough()

export type UserInfo = z.infer<typeof UserInfoSchema>
