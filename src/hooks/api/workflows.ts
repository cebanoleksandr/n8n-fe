import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '../../api/query-keys'
import type {
  CreateWorkflowInput,
  PaginationParams,
  UpdateWorkflowInput,
  Workflow,
  WorkflowImport,
} from '../../api/types'
import { workflowsService } from '../../services/workflows.service'
import type { QueryOptions } from './types'

export function useWorkflows(params: PaginationParams = {}) {
  return useQuery({
    queryKey: queryKeys.workflows.list(params),
    queryFn: () => workflowsService.list(params),
    // Keep the current page visible while the next one loads.
    placeholderData: keepPreviousData,
  })
}

export function useWorkflow(
  id: string | undefined,
  options: QueryOptions<Workflow> = {},
) {
  return useQuery({
    queryKey: queryKeys.workflows.detail(id ?? ''),
    queryFn: () => workflowsService.get(id!),
    enabled: !!id,
    ...options,
  })
}

export function useWorkflowVersions(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.workflows.versions(id ?? ''),
    queryFn: () => workflowsService.listVersions(id!),
    enabled: !!id,
  })
}

/** Versions are immutable, so they never go stale. */
export function useWorkflowVersion(
  id: string | undefined,
  versionId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.workflows.version(id ?? '', versionId ?? ''),
    queryFn: () => workflowsService.getVersion(id!, versionId!),
    enabled: !!id && !!versionId,
    staleTime: Infinity,
  })
}

/** Puts a saved workflow into the cache and marks dependent queries stale. */
function useStoreWorkflow() {
  const queryClient = useQueryClient()
  return (workflow: Workflow, { graphChanged = true } = {}) => {
    queryClient.setQueryData(queryKeys.workflows.detail(workflow.id), workflow)
    const pending = [
      queryClient.invalidateQueries({ queryKey: queryKeys.workflows.lists }),
    ]
    if (graphChanged) {
      pending.push(
        queryClient.invalidateQueries({
          queryKey: queryKeys.workflows.versions(workflow.id),
        }),
      )
    }
    return Promise.all(pending)
  }
}

export function useCreateWorkflow() {
  const store = useStoreWorkflow()
  return useMutation({
    mutationFn: (input: CreateWorkflowInput) => workflowsService.create(input),
    onSuccess: (workflow) => store(workflow),
  })
}

/** Saving a changed graph creates a new version. */
export function useUpdateWorkflow() {
  const store = useStoreWorkflow()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWorkflowInput }) =>
      workflowsService.update(id, input),
    onSuccess: (workflow, { input }) =>
      store(workflow, { graphChanged: !!input.graph }),
  })
}

/** Activates or deactivates triggers, updating the UI before the server answers. */
export function useSetWorkflowActive() {
  const queryClient = useQueryClient()
  const store = useStoreWorkflow()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      workflowsService.update(id, { active }),
    onMutate: async ({ id, active }) => {
      const key = queryKeys.workflows.detail(id)
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Workflow>(key)
      if (previous) queryClient.setQueryData(key, { ...previous, active })
      return { previous }
    },
    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.workflows.detail(id),
          context.previous,
        )
      }
    },
    onSuccess: (workflow) => store(workflow, { graphChanged: false }),
  })
}

export function useDeleteWorkflow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => workflowsService.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.workflows.detail(id) })
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.workflows.lists }),
        // Its executions are deleted with it.
        queryClient.invalidateQueries({ queryKey: queryKeys.executions.all }),
      ])
    },
  })
}

/** Saves the old graph as the newest version. */
export function useRestoreWorkflowVersion() {
  const store = useStoreWorkflow()
  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      workflowsService.restoreVersion(id, versionId),
    onSuccess: (workflow) => store(workflow),
  })
}

export function useExportWorkflow() {
  return useMutation({
    mutationFn: (id: string) => workflowsService.export(id),
  })
}

export function useImportWorkflow() {
  const store = useStoreWorkflow()
  return useMutation({
    mutationFn: (input: WorkflowImport) => workflowsService.import(input),
    onSuccess: (workflow) => store(workflow),
  })
}

export function useListenTestWebhook() {
  return useMutation({
    mutationFn: ({ id, nodeId }: { id: string; nodeId?: string }) =>
      workflowsService.listenTestWebhook(id, nodeId),
  })
}

export function useStopTestWebhook() {
  return useMutation({
    mutationFn: (id: string) => workflowsService.stopTestWebhook(id),
  })
}
