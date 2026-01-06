import type { RoleQuery, RoleUpdateRequest } from "@/schemas/system/role"
import type { Ref } from "vue"

import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import { computed } from "vue"

import { getRoleDetail, getRoleMenuIds, listRolePage, updateRole } from "@/api/system/role"
import { queryKeys } from "@/queries/keys"

export function useRolePageQuery(query: Ref<RoleQuery>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.role.list(query.value)),
    queryFn: () => listRolePage(query.value),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useRoleDetailQuery(roleId: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.role.detail(roleId.value ?? 0)),
    queryFn: () => {
      const id = roleId.value
      if (!id || id <= 0) throw new Error("[SystemRole] roleId is required")
      return getRoleDetail(id)
    },
    enabled: computed(() => Boolean(roleId.value && roleId.value > 0)),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useRoleMenuIdsQuery(roleId: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.role.menus(roleId.value ?? 0)),
    queryFn: () => {
      const id = roleId.value
      if (!id || id <= 0) throw new Error("[SystemRole] roleId is required")
      return getRoleMenuIds(id)
    },
    enabled: computed(() => Boolean(roleId.value && roleId.value > 0)),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useUpdateRoleMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: RoleUpdateRequest) => updateRole(payload),
    onSuccess: (_result, payload) => {
      void queryClient.invalidateQueries({ queryKey: ["system", "role"] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.system.role.menus(payload.id) })
    },
  })
}
