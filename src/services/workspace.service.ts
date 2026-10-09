import { api } from '../api/client'
import type {
  CreatedInvitation,
  Invitation,
  Member,
  Role,
  Workspace,
} from '../api/types'

/** The current workspace, selected by the X-Workspace-Id header. */
export const workspaceService = {
  async get(): Promise<Workspace> {
    const { data } = await api.get<Workspace>('/workspace')
    return data
  },

  async rename(name: string): Promise<Workspace> {
    const { data } = await api.patch<Workspace>('/workspace', { name })
    return data
  },

  async listMembers(): Promise<Member[]> {
    const { data } = await api.get<Member[]>('/workspace/members')
    return data
  },

  /** Returns the updated member list. */
  async changeMemberRole(userId: string, role: Role): Promise<Member[]> {
    const { data } = await api.patch<Member[]>(`/workspace/members/${userId}`, {
      role,
    })
    return data
  },

  /** Admins remove others; anyone may remove themselves (leave). */
  async removeMember(userId: string): Promise<void> {
    await api.delete(`/workspace/members/${userId}`)
  },

  async listInvitations(): Promise<Invitation[]> {
    const { data } = await api.get<Invitation[]>('/workspace/invitations')
    return data
  },

  /** The token is returned only here; build the invite link from it. */
  async invite(email: string, role: Role): Promise<CreatedInvitation> {
    const { data } = await api.post<CreatedInvitation>(
      '/workspace/invitations',
      { email, role },
    )
    return data
  },

  async revokeInvitation(id: string): Promise<void> {
    await api.delete(`/workspace/invitations/${id}`)
  },
}
