import { useSearchParams } from 'react-router-dom'
import { PAGE_SIZES } from '../utils/pagination'
import { LIST_SORTS, type ListSort } from '../utils/sorting'

const DEFAULTS = {
  page: 1,
  limit: 20,
  search: '',
  sort: 'updatedAt:desc' as ListSort,
}

export type ListParams = typeof DEFAULTS

/** List state from the URL, falling back on anything invalid. */
function read(params: URLSearchParams): ListParams {
  const page = Number(params.get('page'))
  const limit = Number(params.get('limit'))
  const sort = params.get('sort') as ListSort
  return {
    page: Number.isInteger(page) && page > 0 ? page : DEFAULTS.page,
    limit: PAGE_SIZES.includes(limit) ? limit : DEFAULTS.limit,
    search: params.get('search')?.trim() ?? DEFAULTS.search,
    sort: LIST_SORTS.includes(sort) ? sort : DEFAULTS.sort,
  }
}

/**
 * Page, page size, search and sort of a list, kept in the URL so a link (or
 * coming back from a detail page) restores them. Other params are left alone.
 */
export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams()

  /** Default values are left out to keep the URL short. */
  const update = (patch: Partial<ListParams>) => {
    setSearchParams(
      (params) => {
        const next = { ...read(params), ...patch }
        for (const key of Object.keys(DEFAULTS) as (keyof ListParams)[]) {
          if (next[key] === DEFAULTS[key]) params.delete(key)
          else params.set(key, String(next[key]))
        }
        return params
      },
      { replace: true },
    )
  }

  return { ...read(searchParams), update }
}
