import {
  type QueryClient,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { getErrorStatus } from '../../api/client'
import { resetWorkspaceQueries } from '../../api/query-client'
import { queryKeys } from '../../api/query-keys'
import { session } from '../../api/session'
import type {
  AcceptInvitationInput,
  ChangePasswordInput,
  LoginInput,
  Me,
  SetupInput,
} from '../../api/types'
import { authService } from '../../services/auth.service'
import { realtimeService } from '../../services/realtime.service'

/** Keeps the selected workspace valid: falls back to the first membership. */
function syncWorkspace(me: Me) {
  const current = session.getWorkspaceId()
  if (me.workspaces.some((w) => w.workspaceId === current)) return
  session.setWorkspaceId(me.workspaces[0]?.workspaceId ?? null)
  void resetWorkspaceQueries()
}

/** A different user may have signed in: drop everything cached before. */
function onSignedIn(queryClient: QueryClient) {
  queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'auth' })
  queryClient.setQueryData(queryKeys.auth.setupStatus, { needsSetup: false })
  return queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
}

export const setupStatusQuery = queryOptions({
  queryKey: queryKeys.auth.setupStatus,
  queryFn: authService.getSetupStatus,
  staleTime: Infinity,
})

export function useSetupStatus() {
  return useQuery(setupStatusQuery)
}

/**
 * The signed-in user with their workspaces, or null when signed out.
 * On page load this restores the session from the refresh cookie.
 */
export const meQuery = queryOptions<Me | null>({
  queryKey: queryKeys.auth.me,
  queryFn: async () => {
    try {
      const me = await authService.me()
      syncWorkspace(me)
      return me
    } catch (err) {
      if (getErrorStatus(err) === 401) return null
      throw err
    }
  },
  staleTime: 5 * 60_000,
})

export function useMe() {
  return useQuery(meQuery)
}

export function useSetup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: SetupInput) => authService.setup(input),
    onSuccess: () => onSignedIn(queryClient),
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: () => onSignedIn(queryClient),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      realtimeService.disconnect()
      queryClient.clear()
      queryClient.setQueryData(queryKeys.auth.me, null)
    },
  })
}

/** Signs out every other session; this one keeps working. */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) =>
      authService.changePassword(input),
  })
}

export function useInvitationInfo(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.auth.invitation(token ?? ''),
    queryFn: () => authService.describeInvitation(token!),
    enabled: !!token,
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      token,
      input,
    }: {
      token: string
      input: AcceptInvitationInput
    }) => authService.acceptInvitation(token, input),
    onSuccess: () => onSignedIn(queryClient),
  })
}
