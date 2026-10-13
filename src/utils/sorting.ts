import { WORKFLOW_SORTS, type WorkflowSort } from '../api/types'

/** The sort options every list offers; the API values of GET /workflows. */
export const LIST_SORTS = WORKFLOW_SORTS
export type ListSort = WorkflowSort

// Translation keys can't contain the API values: i18next reads ":" as the
// namespace separator, so 'sort.name:asc' would come out as just "asc".
export const SORT_LABELS: Record<ListSort, string> = {
  'updatedAt:desc': 'sort.updatedDesc',
  'createdAt:desc': 'sort.createdDesc',
  'name:asc': 'sort.nameAsc',
  'name:desc': 'sort.nameDesc',
}

interface Sortable {
  name: string
  createdAt: string
  updatedAt: string
}

/** Client-side counterpart of the API's sort, for lists loaded whole. */
export function sortItems<T extends Sortable>(items: T[], sort: ListSort): T[] {
  const [field, direction] = sort.split(':') as [keyof Sortable, 'asc' | 'desc']
  const sign = direction === 'asc' ? 1 : -1
  return [...items].sort((a, b) =>
    field === 'name'
      ? sign * a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      : sign * (Date.parse(a[field]) - Date.parse(b[field])),
  )
}
