import { z } from "zod"

export const MenuQuerySchema = z
  .object({
    menuName: z.string().optional(),
    status: z.number().int().optional(),
    visible: z.number().int().optional(),
  })
  .passthrough()

export type MenuQuery = z.infer<typeof MenuQuerySchema>

export const MenuCreateRequestSchema = z
  .object({
    parentId: z.number().int().optional(),
    menuName: z.string().min(1).max(50),
    orderNum: z.number().int().optional(),
    path: z.string().max(200).optional(),
    component: z.string().max(200).optional(),
    queryParam: z.string().optional(),
    isFrame: z.number().int().optional(),
    isCache: z.number().int().optional(),
    menuType: z.string().min(1),
    visible: z.number().int().optional(),
    perms: z.string().max(100).optional(),
    icon: z.string().optional(),
    status: z.number().int().optional(),
    remark: z.string().optional(),
  })
  .passthrough()

export type MenuCreateRequest = z.infer<typeof MenuCreateRequestSchema>

export const MenuUpdateRequestSchema = MenuCreateRequestSchema.extend({
  id: z.number().int(),
})

export type MenuUpdateRequest = z.infer<typeof MenuUpdateRequestSchema>

export interface MenuVO extends z.infer<typeof MenuVOSchema> {}

export const MenuVOSchema: z.ZodType<{
  id?: number
  parentId?: number
  menuName?: string
  orderNum?: number
  path?: string
  component?: string
  queryParam?: string
  isFrame?: number
  isCache?: number
  menuType?: string
  visible?: number
  perms?: string
  icon?: string
  status?: number
  remark?: string
  children?: MenuVO[]
}> = z.lazy(() =>
  z
    .object({
      id: z.number().int().optional(),
      parentId: z.number().int().optional(),
      menuName: z.string().optional(),
      orderNum: z.number().int().optional(),
      path: z.string().optional(),
      component: z.string().optional(),
      queryParam: z.string().optional(),
      isFrame: z.number().int().optional(),
      isCache: z.number().int().optional(),
      menuType: z.string().optional(),
      visible: z.number().int().optional(),
      perms: z.string().optional(),
      icon: z.string().optional(),
      status: z.number().int().optional(),
      remark: z.string().optional(),
      children: z.array(MenuVOSchema).optional(),
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
