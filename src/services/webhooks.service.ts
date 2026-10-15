import { api } from '../api/client'
import type { WebhookUrls } from '../api/types'

export const webhooksService = {
  /** Base URLs of Webhook nodes: <base>/<path>. */
  async urls(): Promise<WebhookUrls> {
    const { data } = await api.get<WebhookUrls>('/webhooks/urls')
    return data
  },
}
