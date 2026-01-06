import type {
  DictDataCreateRequest,
  DictDataQuery,
  DictDataUpdateRequest,
  DictTypeCreateRequest,
  DictTypeQuery,
  DictTypeUpdateRequest,
} from "@/schemas/system/dict"
import type { Ref } from "vue"

import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import { computed } from "vue"

import {
  createDictData,
  createDictType,
  deleteDictData,
  deleteDictTypes,
  listDictDataByType,
  listDictDataPage,
  listDictTypePage,
  updateDictData,
  updateDictType,
} from "@/api/system/dict"
import { queryKeys } from "@/queries/keys"

export function useDictTypePageQuery(query: Ref<DictTypeQuery>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.dict.typeList(query.value)),
    queryFn: () => listDictTypePage(query.value),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useDictDataByTypeQuery(dictType: Ref<string | null>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.dict.dataByType(dictType.value ?? "")),
    queryFn: () => {
      const type = dictType.value
      if (!type) throw new Error("[SystemDict] dictType is required")
      return listDictDataByType(type)
    },
    enabled: computed(() => Boolean(dictType.value)),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useDictDataPageQuery(query: Ref<DictDataQuery>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.dict.dataList(query.value)),
    queryFn: () => listDictDataPage(query.value),
    enabled: computed(() => Boolean(query.value.dictType && String(query.value.dictType).trim())),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useCreateDictTypeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DictTypeCreateRequest) => createDictType(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dict"] }),
  })
}

export function useUpdateDictTypeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DictTypeUpdateRequest) => updateDictType(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dict"] }),
  })
}

export function useDeleteDictTypesMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dictIds: number[]) => deleteDictTypes(dictIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dict"] }),
  })
}

export function useCreateDictDataMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DictDataCreateRequest) => createDictData(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dict"] }),
  })
}

export function useUpdateDictDataMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: DictDataUpdateRequest) => updateDictData(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dict"] }),
  })
}

export function useDeleteDictDataMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dictCodes: number[]) => deleteDictData(dictCodes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "dict"] }),
  })
}
