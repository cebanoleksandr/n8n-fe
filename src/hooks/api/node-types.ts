import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/query-keys'
import type { NodeTypeDescription } from '../../api/types'
import { nodeTypesService } from '../../services/node-types.service'

export function useNodeTypes() {
  return useQuery({
    queryKey: queryKeys.static.nodeTypes,
    queryFn: nodeTypesService.list,
    staleTime: Infinity,
  })
}

/** One node type's description, from the cached catalog. */
export function useNodeType(type: string | undefined) {
  return useQuery({
    queryKey: queryKeys.static.nodeTypes,
    queryFn: nodeTypesService.list,
    staleTime: Infinity,
    enabled: !!type,
    select: (types: NodeTypeDescription[]) =>
      types.find((t) => t.type === type),
  })
}
