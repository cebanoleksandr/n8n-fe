import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent } from 'react'
import { queryKeys } from '../../api/query-keys'
import type { Execution, ExecutionEvent } from '../../api/types'
import { realtimeService } from '../../services/realtime.service'

/**
 * Subscribes to live events of a workflow (all its runs) or one execution and
 * keeps the executions cache fresh. Pass null to stay unsubscribed.
 */
export function useExecutionEvents(
  target: { workflowId?: string; executionId?: string } | null,
  onEvent?: (event: ExecutionEvent) => void,
) {
  const queryClient = useQueryClient()
  const workflowId = target?.workflowId
  const executionId = target?.executionId

  const handle = useEffectEvent((event: ExecutionEvent) => {
    applyToCache(queryClient, event)
    onEvent?.(event)
  })

  useEffect(() => {
    if (!workflowId && !executionId) return
    return realtimeService.subscribe({ workflowId, executionId }, (event) =>
      handle(event),
    )
  }, [workflowId, executionId])
}

function applyToCache(
  queryClient: ReturnType<typeof useQueryClient>,
  event: ExecutionEvent,
) {
  const detailKey = queryKeys.executions.detail(event.executionId)
  const patch = (fields: Partial<Execution>) =>
    queryClient.setQueryData<Execution>(detailKey, (old) =>
      old ? { ...old, ...fields } : old,
    )
  const refreshLists = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.executions.lists })

  switch (event.type) {
    case 'execution.queued':
      void refreshLists()
      break
    case 'execution.started':
      patch({ status: 'running', startedAt: event.startedAt })
      void refreshLists()
      break
    case 'execution.waiting':
      patch({ status: 'waiting', waitTill: event.waitTill })
      void refreshLists()
      break
    case 'node.finished':
      // Events carry no node output: fetch the steps. Do not restart a fetch
      // already in flight, busy runs finish many nodes per second.
      void queryClient.invalidateQueries(
        { queryKey: detailKey },
        { cancelRefetch: false },
      )
      break
    case 'execution.finished':
      patch({
        status: event.status,
        error: event.error,
        finishedAt: event.finishedAt,
      })
      void queryClient.invalidateQueries({ queryKey: detailKey })
      void refreshLists()
      break
  }
}
