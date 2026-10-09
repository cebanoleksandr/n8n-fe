import type { QueryKey, UseQueryOptions } from '@tanstack/react-query'

/** Extra options a query hook accepts (enabled, refetchInterval, ...). */
export type QueryOptions<T> = Omit<
  UseQueryOptions<T, Error, T, QueryKey>,
  'queryKey' | 'queryFn'
>
