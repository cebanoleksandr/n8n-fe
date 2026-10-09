import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/query-keys'
import type {
  CreateCredentialInput,
  Credential,
  UpdateCredentialInput,
} from '../../api/types'
import { credentialsService } from '../../services/credentials.service'
import type { QueryOptions } from './types'

export function useCredentialTypes() {
  return useQuery({
    queryKey: queryKeys.static.credentialTypes,
    queryFn: credentialsService.listTypes,
    staleTime: Infinity,
  })
}

/** Optionally only credentials of one type (e.g. for a node's selector). */
export function useCredentials(type?: string) {
  return useQuery({
    queryKey: queryKeys.credentials.list(type),
    queryFn: () => credentialsService.list(type),
  })
}

/** Requires the editor role. Secret fields are never returned. */
export function useCredential(
  id: string | undefined,
  options: QueryOptions<Credential> = {},
) {
  return useQuery({
    queryKey: queryKeys.credentials.detail(id ?? ''),
    queryFn: () => credentialsService.get(id!),
    enabled: !!id,
    ...options,
  })
}

function useStoreCredential() {
  const queryClient = useQueryClient()
  return (credential: Credential) => {
    queryClient.setQueryData(
      queryKeys.credentials.detail(credential.id),
      credential,
    )
    return queryClient.invalidateQueries({
      queryKey: queryKeys.credentials.lists,
    })
  }
}

export function useCreateCredential() {
  const store = useStoreCredential()
  return useMutation({
    mutationFn: (input: CreateCredentialInput) =>
      credentialsService.create(input),
    onSuccess: store,
  })
}

/** `data` is merged into the stored data: omitted fields keep their values. */
export function useUpdateCredential() {
  const store = useStoreCredential()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCredentialInput }) =>
      credentialsService.update(id, input),
    onSuccess: store,
  })
}

export function useDeleteCredential() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => credentialsService.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.credentials.detail(id) })
      return queryClient.invalidateQueries({
        queryKey: queryKeys.credentials.lists,
      })
    },
  })
}

export function useOAuth2RedirectUri() {
  return useQuery({
    queryKey: queryKeys.credentials.oauth2RedirectUri,
    queryFn: credentialsService.getOAuth2RedirectUri,
    staleTime: Infinity,
  })
}

/**
 * Opens the provider's consent page in a popup. Call `mutate(id)` directly in
 * a click handler so the popup is not blocked. Resolves with { ok, message }.
 */
export function useConnectOAuth2Credential() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => credentialsService.connectOAuth2(id),
    onSettled: (_data, _err, id) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.credentials.detail(id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.credentials.lists,
        }),
      ]),
  })
}
