import { useState } from 'react'

export type DataView = 'fields' | 'json'

/** The chosen view of a data column, remembered per column ("input"/"output"). */
export function useDataView(column: 'input' | 'output') {
  const key = `flow:dataView:${column}`
  const [view, setView] = useState<DataView>(() => {
    try {
      return localStorage.getItem(key) === 'json' ? 'json' : 'fields'
    } catch {
      return 'fields'
    }
  })
  const change = (next: DataView) => {
    setView(next)
    try {
      localStorage.setItem(key, next)
    } catch {
      // Storage unavailable: the choice lasts for this page only.
    }
  }
  return [view, change] as const
}
