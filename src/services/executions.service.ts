import { api } from '../api/client'
import type {
  Execution,
  ExecutionSummary,
  ListExecutionsParams,
  Page,
  RunWorkflowInput,
} from '../api/types'

export const executionsService = {
  async list(params: ListExecutionsParams = {}): Promise<Page<ExecutionSummary>> {
    const { data } = await api.get<Page<ExecutionSummary>>('/executions', {
      params,
    })
    return data
  },

  async get(id: string): Promise<Execution> {
    const { data } = await api.get<Execution>(`/executions/${id}`)
    return data
  },

  /** Queues a manual run and returns right away (202). */
  async run(
    workflowId: string,
    input: RunWorkflowInput = {},
  ): Promise<ExecutionSummary> {
    const { data } = await api.post<ExecutionSummary>(
      `/workflows/${workflowId}/run`,
      input,
    )
    return data
  },

  /** Responds when the run finishes (the server waits up to 60s). */
  async runAndWait(
    workflowId: string,
    input: RunWorkflowInput = {},
  ): Promise<Execution> {
    const { data } = await api.post<Execution>(
      `/workflows/${workflowId}/run`,
      input,
      { params: { wait: true } },
    )
    return data
  },

  /** 409 when the execution already finished. */
  async cancel(id: string): Promise<Execution> {
    const { data } = await api.post<Execution>(`/executions/${id}/cancel`)
    return data
  },
}
