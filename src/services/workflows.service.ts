import { api } from '../api/client'
import type {
  CreateWorkflowInput,
  Page,
  PaginationParams,
  TestWebhookListening,
  UpdateWorkflowInput,
  Workflow,
  WorkflowExport,
  WorkflowImport,
  WorkflowSummary,
  WorkflowVersion,
  WorkflowVersionWithGraph,
} from '../api/types'

export const workflowsService = {
  /** Newest first (by updatedAt). */
  async list(params: PaginationParams = {}): Promise<Page<WorkflowSummary>> {
    const { data } = await api.get<Page<WorkflowSummary>>('/workflows', {
      params,
    })
    return data
  },

  async get(id: string): Promise<Workflow> {
    const { data } = await api.get<Workflow>(`/workflows/${id}`)
    return data
  },

  async create(input: CreateWorkflowInput): Promise<Workflow> {
    const { data } = await api.post<Workflow>('/workflows', input)
    return data
  },

  async update(id: string, input: UpdateWorkflowInput): Promise<Workflow> {
    const { data } = await api.put<Workflow>(`/workflows/${id}`, input)
    return data
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`)
  },

  async listVersions(id: string): Promise<WorkflowVersion[]> {
    const { data } = await api.get<WorkflowVersion[]>(
      `/workflows/${id}/versions`,
    )
    return data
  },

  async getVersion(
    id: string,
    versionId: string,
  ): Promise<WorkflowVersionWithGraph> {
    const { data } = await api.get<WorkflowVersionWithGraph>(
      `/workflows/${id}/versions/${versionId}`,
    )
    return data
  },

  /** Saves the old graph as a new version. */
  async restoreVersion(id: string, versionId: string): Promise<Workflow> {
    const { data } = await api.post<Workflow>(
      `/workflows/${id}/versions/${versionId}/restore`,
    )
    return data
  },

  async export(id: string): Promise<WorkflowExport> {
    const { data } = await api.get<WorkflowExport>(`/workflows/${id}/export`)
    return data
  },

  /** Credential references unknown to this workspace are dropped. */
  async import(input: WorkflowImport): Promise<Workflow> {
    const { data } = await api.post<Workflow>('/workflows/import', input)
    return data
  },

  /** Listen on /webhook-test/<path> for one request per Webhook node. */
  async listenTestWebhook(
    id: string,
    nodeId?: string,
  ): Promise<TestWebhookListening> {
    const { data } = await api.post<TestWebhookListening>(
      `/workflows/${id}/test-webhook`,
      nodeId ? { nodeId } : {},
    )
    return data
  },

  async stopTestWebhook(id: string): Promise<void> {
    await api.delete(`/workflows/${id}/test-webhook`)
  },
}
