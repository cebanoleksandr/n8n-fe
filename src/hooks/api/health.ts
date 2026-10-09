import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/query-keys'
import { healthService } from '../../services/health.service'

export function useHealthReady(options: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: healthService.ready,
    retry: false,
    ...options,
  })
}
