import { useState } from 'react'

const KEY = 'flow:executionsAutoRefresh'

function read() {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

/** The "Auto refresh" checkbox of executions lists, remembered per browser. */
export function useAutoRefresh() {
  const [autoRefresh, setAutoRefresh] = useState(read)

  const set = (value: boolean) => {
    setAutoRefresh(value)
    try {
      localStorage.setItem(KEY, value ? '1' : '0')
    } catch {
      // Storage unavailable: the choice lasts for this page only.
    }
  }

  return [autoRefresh, set] as const
}
