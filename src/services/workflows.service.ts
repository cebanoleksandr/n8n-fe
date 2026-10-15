import { api, API_URL } from '../api/client'
import { session } from '../api/session'
import type {
  CreateWorkflowInput,
  Page,
  ListWorkflowsParams,
  TestWebhookListening,
  UpdateWorkflowInput,
  Workflow,
  WorkflowExport,
  WorkflowGraph,
  WorkflowImport,
  WorkflowSummary,
  WorkflowVersion,
  WorkflowVersionWithGraph,
} from '../api/types'

export const workflowsService = {
  /**
   * Saves the graph while the page is closing or reloading: a keepalive fetch
   * outlives the page, unlike axios. Fire and forget, nothing to await.
   */
  saveGraphOnUnload(id: string, graph: WorkflowGraph): void {
    const token = session.getAccessToken()
    const workspaceId = session.getWorkspaceId()
    if (!token) return
    void fetch(`${API_URL}/workflows/${id}`, {
      method: 'PUT',
      keepalive: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(workspaceId && { 'X-Workspace-Id': workspaceId }),
      },
      body: JSON.stringify({ graph }),
    }).catch(() => {
      // The page is gone; nothing left to tell.
    })
  },

  /** Newest first (by updatedAt). */
  async list(params: ListWorkflowsParams = {}): Promise<Page<WorkflowSummary>> {
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
