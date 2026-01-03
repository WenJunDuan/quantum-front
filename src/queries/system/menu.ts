// {{RIPER-10 Action}}
// Role: LD | Task_ID: #system-menu | Time: 2026-01-02T00:00:00+08:00
// Principle: Components don't fetch; hooks do.
// Taste: Small query/mutation wrappers with stable keys.

import type { MenuCreateRequest, MenuUpdateRequest } from "@/schemas/system/menu"
import type { Ref } from "vue"

import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import { computed } from "vue"

import { createMenu, deleteMenu, getMenu, listMenuTree, updateMenu } from "@/api/system/menu"
import { queryKeys } from "@/queries/keys"

export function useMenuTreeQuery() {
  return useQuery({
    queryKey: queryKeys.system.menu.tree(),
    queryFn: () => listMenuTree(),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useMenuDetailQuery(menuId: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.menu.detail(menuId.value ?? 0)),
    queryFn: () => {
      const id = menuId.value
      if (id === null || id <= 0) throw new Error("[SystemMenu] menuId is required")
      return getMenu(id)
    },
    enabled: computed(() => menuId.value !== null && menuId.value > 0),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useCreateMenuMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: MenuCreateRequest) => createMenu(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.system.menu.tree() }),
  })
}

export function useUpdateMenuMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: MenuUpdateRequest) => updateMenu(payload),
    onSuccess: (_result, payload) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.system.menu.tree() })
      void queryClient.invalidateQueries({
        queryKey: queryKeys.system.menu.detail(payload.id),
      })
    },
  })
}

export function useDeleteMenuMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (menuId: number) => deleteMenu(menuId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.system.menu.tree() }),
  })
}
