import { QueryClient } from '@tanstack/react-query'
import { getErrorStatus, setUnauthenticatedHandler } from './client'
import { queryKeys } from './query-keys'

const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx will not fix itself; retry only network errors and 5xx.
      retry: (failureCount, error) => {
        const status = getErrorStatus(error)
        if (status !== undefined && status < 500) return false
        return failureCount < MAX_RETRIES
      },
      refetchOnWindowFocus: false,
    },
  },
})

/** Drops all workspace data; 'auth' and 'static' queries are kept. */
export function resetWorkspaceQueries() {
  return queryClient.resetQueries({
    predicate: (q) => q.queryKey[0] !== 'auth' && q.queryKey[0] !== 'static',
  })
}

// Object URLs from useBinaryDataUrl hold the file in memory until revoked.
queryClient.getQueryCache().subscribe((event) => {
  const { queryKey, state } = event.query
  if (
    event.type === 'removed' &&
    queryKey[0] === 'binary-data' &&
    queryKey[2] === 'object-url' &&
    typeof state.data === 'string'
  ) {
    URL.revokeObjectURL(state.data)
  }
})

// The refresh token is gone or revoked: the user is logged out.
setUnauthenticatedHandler(() => {
  queryClient.setQueryData(queryKeys.auth.me, null)
  queryClient.removeQueries({
    predicate: (q) => q.queryKey[0] !== 'auth',
  })
})
