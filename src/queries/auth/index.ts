import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query"

import { createCaptcha, getUserInfo, login, type LoginPayload } from "@/api/auth"
import { queryKeys } from "@/queries/keys"
import { useUserStore } from "@/stores/user"

export function useCaptchaQuery() {
  return useQuery({
    queryKey: queryKeys.auth.captcha(),
    queryFn: createCaptcha,
    enabled: false,
    retry: 0,
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })
}

export function useLoginMutation() {
  const userStore = useUserStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (response) => {
      userStore.setTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken ?? null,
      })
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.userInfo() })
    },
  })
}

export function useUserInfoQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.auth.userInfo(),
    queryFn: getUserInfo,
    enabled,
    retry: 1,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}
