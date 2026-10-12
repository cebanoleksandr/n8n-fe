import { api, refreshSession } from '../api/client'
import { session } from '../api/session'
import type {
  AcceptInvitationInput,
  ChangePasswordInput,
  InvitationInfo,
  LoginInput,
  Me,
  Session,
  RegisterInput,
} from '../api/types'

function startSession(data: Session): Session {
  session.setAccessToken(data.accessToken)
  return data
}

export const authService = {
  /**
   * Creates the account and its own workspace, and signs in.
   * Errors: 409 email taken, 400 invalid fields, 403 sign-up disabled,
   * 429 too many sign-ups from this address.
   */
  async register(input: RegisterInput): Promise<Session> {
    const { data } = await api.post<Session>('/auth/register', input)
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
