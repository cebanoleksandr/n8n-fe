import { api } from '../api/client'
import type { HealthReady } from '../api/types'

export const healthService = {
  async live(): Promise<{ status: 'ok' }> {
    const { data } = await api.get<{ status: 'ok' }>('/health')
    return data
  },

  /** 503 (thrown) when Postgres, Redis or storage is down. */
  async ready(): Promise<HealthReady> {
    const { data } = await api.get<HealthReady>('/health/ready')
    return data
  },
}
