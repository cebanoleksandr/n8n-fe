/**
 * Client-side auth state. The access token lives only in memory; the refresh
 * token is an httpOnly cookie the browser sends to /api/auth. The selected
 * workspace is remembered in localStorage and sent as X-Workspace-Id.
 */

const WORKSPACE_KEY = 'flow:workspaceId'

let accessToken: string | null = null
let workspaceId: string | null = readStoredWorkspace()
const listeners = new Set<() => void>()

function readStoredWorkspace(): string | null {
  try {
    return localStorage.getItem(WORKSPACE_KEY)
  } catch {
    return null
  }
}

function emit() {
  for (const listener of listeners) listener()
}

export const session = {
  getAccessToken: () => accessToken,

  setAccessToken(token: string | null) {
    if (token === accessToken) return
    accessToken = token
    emit()
  },

  getWorkspaceId: () => workspaceId,

  setWorkspaceId(id: string | null) {
    if (id === workspaceId) return
    workspaceId = id
    try {
      if (id) localStorage.setItem(WORKSPACE_KEY, id)
      else localStorage.removeItem(WORKSPACE_KEY)
    } catch {
      // Storage unavailable: the choice lasts for this page only.
    }
    emit()
  },

  clear() {
    accessToken = null
    emit()
  },

  /** For useSyncExternalStore. */
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
