// {{RIPER-10 Action}}
// Role: LD | Task_ID: #system-dept-api | Time: 2026-01-04T00:00:00+08:00
// Principle: Components don't fetch; hooks do.
// Taste: Stable query keys + small wrappers.

import type { DeptCreateRequest, DeptQuery, DeptUpdateRequest } from "@/schemas/system/dept"
import type { Ref } from "vue"

import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import { computed } from "vue"

import {
  createDept,
  deleteDept,
  listDeptTree,
  listDeptTreeSelect,
  updateDept,
} from "@/api/system/dept"
import { queryKeys } from "@/queries/keys"

export function useDeptTreeQuery(query: Ref<DeptQuery>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.dept.list(query.value)),
    queryFn: () => listDeptTree(query.value),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useDeptTreeSelectQuery(query: Ref<DeptQuery>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.dept.treeSelect(query.value)),
    queryFn: () => listDeptTreeSelect(query.value),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useCreateDeptMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DeptCreateRequest) => createDept(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dept"] }),
  })
}

export function useUpdateDeptMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DeptUpdateRequest) => updateDept(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dept"] }),
  })
}

export function useDeleteDeptMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (deptId: number) => deleteDept(deptId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dept"] }),
  })
}
