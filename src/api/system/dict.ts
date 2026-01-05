// {{RIPER-10 Action}}
// Role: LD | Task_ID: #system-dict-api | Time: 2026-01-04T00:00:00+08:00
// Principle: Keep API wrappers small and type-safe.
// Taste: Parse with zod before reaching components.

import { z } from "zod"

import {
  DictDataCreateRequestSchema,
  DictDataVOSchema,
  DictDataUpdateRequestSchema,
  DictTypeCreateRequestSchema,
  DictTypeUpdateRequestSchema,
  PageResultDictTypeVOSchema,
  type DictDataCreateRequest,
  type DictDataQuery,
  type DictDataVO,
  type DictDataUpdateRequest,
  type DictTypeCreateRequest,
  type DictTypeQuery,
  type DictTypeUpdateRequest,
  type PageResultDictTypeVO,
  type DictTypeVO,
  DictTypeVOSchema,
} from "@/schemas/system/dict"
import request from "@/utils/request"

export async function listDictTypePage(query: DictTypeQuery = {}): Promise<PageResultDictTypeVO> {
  const data = await request.get<unknown>("/system/dict/type/list", { params: query })
  return PageResultDictTypeVOSchema.parse(data)
}

export async function getDictTypeDetail(dictId: number): Promise<DictTypeVO> {
  const data = await request.get<unknown>(`/system/dict/type/${dictId}`)
  return DictTypeVOSchema.parse(data)
}

export async function listDictDataByType(dictType: string): Promise<DictDataVO[]> {
  const data = await request.get<unknown>(`/system/dict/data/type/${encodeURIComponent(dictType)}`)
  return z.array(DictDataVOSchema).parse(data)
}

export async function listDictDataPage(query: DictDataQuery = {}): Promise<DictDataVO[]> {
  const data = await request.get<unknown>("/system/dict/data/list", { params: query })
  return z.array(DictDataVOSchema).parse(data)
}

export async function createDictType(payload: DictTypeCreateRequest): Promise<number> {
  DictTypeCreateRequestSchema.parse(payload)
  const data = await request.post<unknown>("/system/dict/type", payload)
  return z.number().int().parse(data)
}

export async function updateDictType(payload: DictTypeUpdateRequest): Promise<void> {
  DictTypeUpdateRequestSchema.parse(payload)
  await request.put("/system/dict/type", payload)
}

export async function deleteDictTypes(dictIds: number[]): Promise<void> {
  const ids = dictIds.filter((id) => typeof id === "number" && Number.isInteger(id) && id > 0)
  if (ids.length === 0) throw new Error("[SystemDict] dictIds is required")
  await request.delete(`/system/dict/type/${ids.join(",")}`)
}

export async function createDictData(payload: DictDataCreateRequest): Promise<number> {
  DictDataCreateRequestSchema.parse(payload)
  const data = await request.post<unknown>("/system/dict/data", payload)
  return z.number().int().parse(data)
}

export async function updateDictData(payload: DictDataUpdateRequest): Promise<void> {
  DictDataUpdateRequestSchema.parse(payload)
  await request.put("/system/dict/data", payload)
}

export async function deleteDictData(dictCodes: number[]): Promise<void> {
  const ids = dictCodes.filter((id) => typeof id === "number" && Number.isInteger(id) && id > 0)
  if (ids.length === 0) throw new Error("[SystemDict] dictCodes is required")
  await request.delete(`/system/dict/data/${ids.join(",")}`)
}
