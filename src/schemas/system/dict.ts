import { z } from "zod"

export const DictTypeQuerySchema = z
  .object({
    pageNum: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    orderBy: z.string().optional(),
    orderDirection: z.string().optional(),
    dictName: z.string().optional(),
    dictType: z.string().optional(),
    status: z.number().int().optional(),
    asc: z.boolean().optional(),
  })
  .passthrough()

export type DictTypeQuery = z.infer<typeof DictTypeQuerySchema>

export const DictTypeCreateRequestSchema = z
  .object({
    dictName: z.string().min(1),
    dictType: z.string().min(1),
    status: z.number().int().optional(),
    remark: z.string().optional(),
  })
  .passthrough()

export type DictTypeCreateRequest = z.infer<typeof DictTypeCreateRequestSchema>

export const DictTypeUpdateRequestSchema = DictTypeCreateRequestSchema.extend({
  id: z.number().int(),
})

export type DictTypeUpdateRequest = z.infer<typeof DictTypeUpdateRequestSchema>

export const DictTypeVOSchema = z
  .object({
    id: z.number().int().optional(),
    createTime: z.string().optional(),
    createBy: z.number().int().optional(),
    updateTime: z.string().optional(),
    updateBy: z.number().int().optional(),
    deleted: z.number().int().optional(),
    version: z.number().int().optional(),
    dictName: z.string().optional(),
    dictType: z.string().optional(),
    status: z.number().int().optional(),
    remark: z.string().optional(),
  })
  .passthrough()

export interface DictTypeVO extends z.infer<typeof DictTypeVOSchema> {}

export const PageResultDictTypeVOSchema = z
  .object({
    pageNum: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    total: z.number().int().optional(),
    pages: z.number().int().optional(),
    records: z.array(DictTypeVOSchema).optional(),
  })
  .passthrough()

export type PageResultDictTypeVO = z.infer<typeof PageResultDictTypeVOSchema>

export const DictDataQuerySchema = z
  .object({
    pageNum: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    orderBy: z.string().optional(),
    orderDirection: z.string().optional(),
    dictType: z.string().optional(),
    dictLabel: z.string().optional(),
    status: z.number().int().optional(),
    asc: z.boolean().optional(),
  })
  .passthrough()

export type DictDataQuery = z.infer<typeof DictDataQuerySchema>

export const DictDataCreateRequestSchema = z
  .object({
    dictType: z.string().min(1),
    dictLabel: z.string().min(1),
    dictValue: z.string().min(1),
    dictSort: z.number().int().optional(),
    cssClass: z.string().optional(),
    listClass: z.string().optional(),
    isDefault: z.string().optional(),
    status: z.number().int().optional(),
    remark: z.string().optional(),
  })
  .passthrough()

export type DictDataCreateRequest = z.infer<typeof DictDataCreateRequestSchema>

export const DictDataUpdateRequestSchema = DictDataCreateRequestSchema.extend({
  id: z.number().int(),
})

export type DictDataUpdateRequest = z.infer<typeof DictDataUpdateRequestSchema>

export const DictDataVOSchema = z
  .object({
    id: z.number().int().optional(),
    createTime: z.string().optional(),
    createBy: z.number().int().optional(),
    updateTime: z.string().optional(),
    updateBy: z.number().int().optional(),
    deleted: z.number().int().optional(),
    version: z.number().int().optional(),
    dictType: z.string().optional(),
    dictLabel: z.string().optional(),
    dictValue: z.string().optional(),
    dictSort: z.number().int().optional(),
    cssClass: z.string().optional(),
    listClass: z.string().optional(),
    isDefault: z.string().optional(),
    status: z.number().int().optional(),
    remark: z.string().optional(),
  })
  .passthrough()

export interface DictDataVO extends z.infer<typeof DictDataVOSchema> {}
