// {{RIPER-10 Action}}
// Role: LD | Task_ID: #system-menu | Time: 2026-01-02T00:00:00+08:00
// Principle: Keep API wrappers small and type-safe.
// Taste: Validate responses with zod before reaching components.

import { z } from "zod"

import { RouterVOSchema, type RouterVO } from "@/schemas/auth"
import {
  MenuVOSchema,
  TreeSelectVOSchema,
  type MenuCreateRequest,
  type MenuQuery,
  type MenuUpdateRequest,
  type MenuVO,
  type TreeSelectVO,
} from "@/schemas/system/menu"
import request from "@/utils/request"

export async function getUserRouters(): Promise<RouterVO[]> {
  const data = await request.get<unknown>("/system/menu/getRouters")
  return z.array(RouterVOSchema).parse(data)
}

export async function listMenuTree(query: MenuQuery = {}): Promise<MenuVO[]> {
  const data = await request.get<unknown>("/system/menu/list", { params: query })
  return z.array(MenuVOSchema).parse(data)
}

export async function getMenu(menuId: number): Promise<MenuVO> {
  const data = await request.get<unknown>(`/system/menu/${menuId}`)
  return MenuVOSchema.parse(data)
}

export async function createMenu(payload: MenuCreateRequest): Promise<number> {
  const data = await request.post<unknown>("/system/menu", payload)
  return z.number().int().parse(data)
}

export async function updateMenu(payload: MenuUpdateRequest): Promise<void> {
  await request.put("/system/menu", payload)
}

export async function deleteMenu(menuId: number): Promise<void> {
  await request.delete(`/system/menu/${menuId}`)
}

export async function listMenuTreeSelect(query: MenuQuery = {}): Promise<TreeSelectVO[]> {
  const data = await request.get<unknown>("/system/menu/treeselect", { params: query })
  return z.array(TreeSelectVOSchema).parse(data)
}
