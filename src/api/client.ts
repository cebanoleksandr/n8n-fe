import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios'
import { session } from './session'
import type { ApiErrorBody, Session } from './types'

/** `/api` in dev (proxied by Vite) or an absolute URL such as https://api.example.com/api. */
export const API_URL: string = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: API_URL,
  // The refresh token is an httpOnly cookie scoped to /api/auth.
  withCredentials: true,
})

/** Routes that never need an access token. */
const PUBLIC_ROUTES = [
  /^\/?auth\/(register|login|refresh|logout)$/,
  /^\/?auth\/invitations\//,
  /^\/?health/,
]

function isPublic(url: string | undefined): boolean {
  return !!url && PUBLIC_ROUTES.some((re) => re.test(url))
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

let refreshing: Promise<Session> | null = null
let onUnauthenticated: () => void = () => {}

/** Called once a refresh fails, i.e. the user has to log in again. */
export function setUnauthenticatedHandler(handler: () => void) {
  onUnauthenticated = handler
}

/**
 * Exchanges the refresh cookie for a new access token. Refresh tokens rotate
 * and a reused one revokes the whole session family, so calls are
 * deduplicated within the tab and serialized across tabs with a Web Lock.
 */
export function refreshSession(): Promise<Session> {
  refreshing ??= withRefreshLock(async () => {
    // Plain axios: these calls must not go through the interceptors below.
    const { data } = await axios.post<Session>(`${API_URL}/auth/refresh`, null, {
      withCredentials: true,
    })
    return data
  })
    .then((data) => {
      session.setAccessToken(data.accessToken)
      return data
    })
    .catch((err: unknown) => {
      session.clear()
      onUnauthenticated()
      throw err
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('flow:auth-refresh', fn)
  }
  return fn()
}

// ---------------------------------------------------------------------------
// Interceptors
// ---------------------------------------------------------------------------

api.interceptors.request.use(async (config: RetriableConfig) => {
  const headers = AxiosHeaders.from(config.headers)
  if (!isPublic(config.url)) {
    // Page load: there is no access token yet, but the refresh cookie may be valid.
    if (!session.getAccessToken()) {
      try {
        await refreshSession()
      } catch {
        config._retried = true
      }
    }
    const token = session.getAccessToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }
  const workspaceId = session.getWorkspaceId()
  if (workspaceId) headers.set('X-Workspace-Id', workspaceId)
  config.headers = headers
  return config
})

api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!(error instanceof AxiosError) || !error.config) throw error
  const config = error.config as RetriableConfig
  if (
    error.response?.status !== 401 ||
    config._retried ||
    isPublic(config.url)
  ) {
    throw error
  }
  config._retried = true
  await refreshSession()
  return api(config)
})

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export function isApiError(
  error: unknown,
): error is AxiosError<ApiErrorBody> {
  return error instanceof AxiosError
}

/** HTTP status of a failed request, if it reached the server. */
export function getErrorStatus(error: unknown): number | undefined {
  return isApiError(error) ? error.response?.status : undefined
}

/** Human-readable message for toasts and form errors. */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    const body = error.response?.data
    if (body?.issues?.length) {
      return body.issues
        .map((i) => (i.path ? `${i.path}: ${i.message}` : i.message))
        .join('\n')
    }
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join('\n') : body.message
    }
    return error.message
  }
  return error instanceof Error ? error.message : String(error)
}
