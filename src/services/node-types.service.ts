import { api } from '../api/client'
import type { NodeTypeDescription } from '../api/types'

export const nodeTypesService = {
  async list(): Promise<NodeTypeDescription[]> {
    const { data } = await api.get<NodeTypeDescription[]>('/node-types')
    return data
  },
}
