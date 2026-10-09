import { api } from '../api/client'
import type {
  CreateCredentialInput,
  Credential,
  CredentialTypeDescription,
  UpdateCredentialInput,
} from '../api/types'

const POPUP_FEATURES = 'width=600,height=700'

export interface OAuth2Result {
  ok: boolean
  credentialId?: string
  message: string
}

export const credentialsService = {
  async listTypes(): Promise<CredentialTypeDescription[]> {
    const { data } = await api.get<CredentialTypeDescription[]>(
      '/credential-types',
    )
    return data
  },

  async list(type?: string): Promise<Credential[]> {
    const { data } = await api.get<Credential[]>('/credentials', {
      params: type ? { type } : undefined,
    })
    return data
  },

  async get(id: string): Promise<Credential> {
    const { data } = await api.get<Credential>(`/credentials/${id}`)
    return data
  },

  async create(input: CreateCredentialInput): Promise<Credential> {
    const { data } = await api.post<Credential>('/credentials', input)
    return data
  },

  async update(id: string, input: UpdateCredentialInput): Promise<Credential> {
    const { data } = await api.put<Credential>(`/credentials/${id}`, input)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/credentials/${id}`)
  },

  async getOAuth2AuthUrl(
    id: string,
  ): Promise<{ url: string; redirectUri: string }> {
    const { data } = await api.get<{ url: string; redirectUri: string }>(
      `/credentials/${id}/oauth2/auth-url`,
    )
    return data
  },

  /** The redirect URI to register at OAuth providers. */
  async getOAuth2RedirectUri(): Promise<{ redirectUri: string }> {
    const { data } = await api.get<{ redirectUri: string }>(
      '/oauth2/redirect-uri',
    )
    return data
  },

  /**
   * Runs the OAuth2 flow in a popup. Call it straight from a click handler:
   * the popup is opened synchronously so browsers do not block it.
   * Resolves when the callback page reports back or the popup is closed.
   */
  async connectOAuth2(id: string): Promise<OAuth2Result> {
    const popup = window.open('', 'flow-oauth2', POPUP_FEATURES)
    if (!popup) throw new Error('The popup was blocked by the browser')
    try {
      const { url } = await credentialsService.getOAuth2AuthUrl(id)
      popup.location.href = url
    } catch (err) {
      popup.close()
      throw err
    }
    return waitForOAuth2Callback(popup)
  },
}

function waitForOAuth2Callback(popup: Window): Promise<OAuth2Result> {
  return new Promise((resolve) => {
    const finish = (result: OAuth2Result) => {
      window.removeEventListener('message', onMessage)
      clearInterval(closedPoll)
      resolve(result)
    }
    const onMessage = (event: MessageEvent) => {
      const data = event.data as Partial<OAuth2Result> & { type?: string }
      if (event.source !== popup || data?.type !== 'oauth2-callback') return
      finish({
        ok: !!data.ok,
        credentialId: data.credentialId,
        message: data.message ?? '',
      })
    }
    const closedPoll = setInterval(() => {
      if (popup.closed) finish({ ok: false, message: 'The window was closed' })
    }, 500)
    window.addEventListener('message', onMessage)
  })
}
