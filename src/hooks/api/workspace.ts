import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { resetWorkspaceQueries } from '../../api/query-client'
import { queryKeys } from '../../api/query-keys'
import { session } from '../../api/session'
import { hasRole, type Membership, type Role } from '../../api/types'
import { workspaceService } from '../../services/workspace.service'
import { useMe } from './auth'

/** Id of the workspace sent as X-Workspace-Id. */
export function useWorkspaceId(): string | null {
  return useSyncExternalStore(session.subscribe, session.getWorkspaceId)
}

/** Switches workspace and refetches all workspace data. */
export function useSwitchWorkspace() {
  return useCallback((workspaceId: string) => {
    if (workspaceId === session.getWorkspaceId()) return
    session.setWorkspaceId(workspaceId)
    void resetWorkspaceQueries()
  }, [])
}

/** The caller's membership in the current workspace (from /auth/me). */
export function useCurrentMembership(): Membership | undefined {
  const { data: me } = useMe()
  const workspaceId = useWorkspaceId()
  return me?.workspaces.find((w) => w.workspaceId === workspaceId)
}

/** For hiding controls; the server enforces roles anyway. */
export function useHasRole(required: Role): boolean {
  const membership = useCurrentMembership()
  return !!membership && hasRole(membership.role, required)
}

export function useWorkspace() {
  return useQuery({
    queryKey: queryKeys.workspace.current,
    queryFn: workspaceService.get,
  })
}

export function useRenameWorkspace() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => workspaceService.rename(name),
    onSuccess: (workspace) => {
      queryClient.setQueryData(queryKeys.workspace.current, workspace)
      // The name is also listed in /auth/me memberships.
      return queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.workspace.members,
    queryFn: workspaceService.listMembers,
  })
}

export function useChangeMemberRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      workspaceService.changeMemberRole(userId, role),
    onSuccess: (members) => {
      queryClient.setQueryData(queryKeys.workspace.members, members)
      // The caller may have changed their own role.
      return queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}

/** Removing yourself means leaving the workspace. */
export function useRemoveMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => workspaceService.removeMember(userId),
    onSuccess: (_, userId) => {
      const me = queryClient.getQueryData<{ id: string } | null>(
        queryKeys.auth.me,
      )
      if (me?.id === userId) {
        return queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
      }
      return queryClient.invalidateQueries({
        queryKey: queryKeys.workspace.members,
      })
    },
  })
}

export function useInvitations(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.workspace.invitations,
    queryFn: workspaceService.listInvitations,
    ...options,
  })
}

/** The result's token is shown only once: build the invite link from it. */
export function useInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: Role }) =>
      workspaceService.invite(email, role),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspace.invitations,
      }),
  })
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workspaceService.revokeInvitation(id),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.workspace.invitations,
      }),
  })
}
