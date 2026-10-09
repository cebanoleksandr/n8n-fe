import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/query-keys'
import { binaryDataService } from '../../services/binary-data.service'

/** The file as a Blob (stored files never change). */
export function useBinaryData(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.binaryData.blob(id ?? ''),
    queryFn: () => binaryDataService.fetch(id!),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 60_000,
  })
}

/**
 * An object URL for <img>/<video>/<iframe>. It is revoked when the query
 * leaves the cache (see query-client.ts), a minute after the last user unmounts.
 */
export function useBinaryDataUrl(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.binaryData.objectUrl(id ?? ''),
    queryFn: async () => URL.createObjectURL(await binaryDataService.fetch(id!)),
    enabled: !!id,
    staleTime: Infinity,
    gcTime: 60_000,
  })
}

export function useDownloadBinaryData() {
  return useMutation({
    mutationFn: ({ id, fileName }: { id: string; fileName?: string }) =>
      binaryDataService.download(id, fileName),
  })
}
