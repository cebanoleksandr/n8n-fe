import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/query-keys'
import { webhooksService } from '../../services/webhooks.service'

/** Production and test base URLs of Webhook nodes (server config: fixed). */
export function useWebhookUrls() {
  return useQuery({
    queryKey: queryKeys.static.webhookUrls,
    queryFn: webhooksService.urls,
    staleTime: Infinity,
  })
}
