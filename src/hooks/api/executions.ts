import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '../../api/query-keys'
import type {
  Execution,
  ExecutionSummary,
  ListExecutionsParams,
  Page,
  RunWorkflowInput,
} from '../../api/types'
import { executionsService } from '../../services/executions.service'
import { isFinished } from '../../api/types'
import type { QueryOptions } from './types'

export function useExecutions(
  params: ListExecutionsParams = {},
  options: QueryOptions<Page<ExecutionSummary>> = {},
) {
  return useQuery({
    queryKey: queryKeys.executions.list(params),
    queryFn: () => executionsService.list(params),
    placeholderData: keepPreviousData,
    ...options,
  })
}

/**
 * Pair with useExecutionEvents for live updates, and pass pollWhileRunning
 * so a missed event can't leave the run looking unfinished.
 */
export function useExecution(
  id: string | undefined,
  options: QueryOptions<Execution> = {},
) {
  return useQuery({
    queryKey: queryKeys.executions.detail(id ?? ''),
    queryFn: () => executionsService.get(id!),
    enabled: !!id,
    ...options,
  })
}

interface RunVariables {
  workflowId: string
  input?: RunWorkflowInput
}

/** Queues a manual run; follow it with useExecution / useExecutionEvents. */
export function useRunWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workflowId, input }: RunVariables) =>
      executionsService.run(workflowId, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.executions.lists }),
  })
}

/** Runs and resolves with the finished execution (server waits up to 60s). */
export function useRunWorkflowAndWait() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workflowId, input }: RunVariables) =>
      executionsService.runAndWait(workflowId, input),
    onSuccess: (execution) => {
      queryClient.setQueryData(
        queryKeys.executions.detail(execution.id),
        execution,
      )
      return queryClient.invalidateQueries({
        queryKey: queryKeys.executions.lists,
      })
    },
  })
}

/** 409 when the run already finished. */
export function useCancelExecution() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => executionsService.cancel(id),
    onSuccess: (execution) => {
      queryClient.setQueryData(
        queryKeys.executions.detail(execution.id),
        execution,
      )
      return queryClient.invalidateQueries({
        queryKey: queryKeys.executions.lists,
      })
    },
  })
}

/** How often a run in progress is re-read, in case a live event was missed. */
const RUNNING_POLL_MS = 2000

/**
 * Re-reads an execution while it runs. Live events do the real work; this
 * catches up when one is lost (it finished before the subscription, or the
 * socket reconnected), so a page never shows "running" forever.
 */
export const pollWhileRunning = {
  refetchInterval: (query: { state: { data?: Execution } }) =>
    query.state.data && isFinished(query.state.data.status) ? false : RUNNING_POLL_MS,
}
