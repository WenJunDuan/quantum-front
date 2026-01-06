import type { UserCreateRequest, UserQuery, UserUpdateRequest } from "@/schemas/system/user"
import type { Ref } from "vue"

import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"
import { computed } from "vue"

import { createUser, deleteUsers, getUserDetail, listUserPage, updateUser } from "@/api/system/user"
import { queryKeys } from "@/queries/keys"

export function useUserPageQuery(query: Ref<UserQuery>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.user.list(query.value)),
    queryFn: () => listUserPage(query.value),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useUserDetailQuery(userId: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => queryKeys.system.user.detail(userId.value ?? 0)),
    queryFn: () => {
      const id = userId.value
      if (!id || id <= 0) throw new Error("[SystemUser] userId is required")
      return getUserDetail(id)
    },
    enabled: computed(() => Boolean(userId.value && userId.value > 0)),
    retry: 1,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UserCreateRequest) => createUser(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "user"] }),
  })
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UserUpdateRequest) => updateUser(payload),
    onSuccess: (_result, payload) => {
      void queryClient.invalidateQueries({ queryKey: ["system", "user"] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.system.user.detail(payload.id) })
    },
  })
}

export function useDeleteUsersMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userIds: number[]) => deleteUsers(userIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "user"] }),
  })
}
