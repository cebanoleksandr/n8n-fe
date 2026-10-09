import { api, refreshSession } from '../api/client'
import { session } from '../api/session'
import type {
  AcceptInvitationInput,
  ChangePasswordInput,
  InvitationInfo,
  LoginInput,
  Me,
  Session,
  SetupInput,
} from '../api/types'

function startSession(data: Session): Session {
  session.setAccessToken(data.accessToken)
  return data
}

export const authService = {
  async getSetupStatus(): Promise<{ needsSetup: boolean }> {
    const { data } = await api.get<{ needsSetup: boolean }>('/auth/setup')
    return data
  },

  /** Creates the first user (owner). Works only once. */
  async setup(input: SetupInput): Promise<Session> {
    const { data } = await api.post<Session>('/auth/setup', input)
    return startSession(data)
  },

  async login(input: LoginInput): Promise<Session> {
    const { data } = await api.post<Session>('/auth/login', input)
    return startSession(data)
  },

  refresh: refreshSession,

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      session.clear()
    }
  },

  async me(): Promise<Me> {
    const { data } = await api.get<Me>('/auth/me')
    return data
  },

  /** Other sessions are signed out; this one gets a new token. */
  async changePassword(input: ChangePasswordInput): Promise<Session> {
    const { data } = await api.post<Session>('/auth/password', input)
    return startSession(data)
  },

  async describeInvitation(token: string): Promise<InvitationInfo> {
    const { data } = await api.get<InvitationInfo>(
      `/auth/invitations/${encodeURIComponent(token)}`,
    )
    return data
  },

  async acceptInvitation(
    token: string,
    input: AcceptInvitationInput,
  ): Promise<Session> {
    const { data } = await api.post<Session>(
      `/auth/invitations/${encodeURIComponent(token)}/accept`,
      input,
    )
    return startSession(data)
  },
}
