import type {
  EvaluateExpressionInput,
  ListExecutionsParams,
  PaginationParams,
} from './types'

/**
 * Keys are hierarchical so a prefix invalidates everything below it.
 * 'auth' and 'static' survive a workspace switch; everything else is
 * workspace data and is reset (see resetWorkspaceQueries).
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
    invitation: (token: string) => ['auth', 'invitation', token] as const,
  },

  workspace: {
    all: ['workspace'] as const,
    current: ['workspace', 'current'] as const,
    members: ['workspace', 'members'] as const,
    invitations: ['workspace', 'invitations'] as const,
  },

  workflows: {
    all: ['workflows'] as const,
    lists: ['workflows', 'list'] as const,
    list: (params: PaginationParams) => ['workflows', 'list', params] as const,
    detail: (id: string) => ['workflows', 'detail', id] as const,
    versions: (id: string) => ['workflows', 'detail', id, 'versions'] as const,
    version: (id: string, versionId: string) =>
      ['workflows', 'detail', id, 'versions', versionId] as const,
  },

  executions: {
    all: ['executions'] as const,
    lists: ['executions', 'list'] as const,
    list: (params: ListExecutionsParams) =>
      ['executions', 'list', params] as const,
    detail: (id: string) => ['executions', 'detail', id] as const,
  },

  credentials: {
    all: ['credentials'] as const,
    lists: ['credentials', 'list'] as const,
    list: (type?: string) => ['credentials', 'list', type ?? null] as const,
    detail: (id: string) => ['credentials', 'detail', id] as const,
    oauth2RedirectUri: ['credentials', 'oauth2-redirect-uri'] as const,
  },

  binaryData: {
    blob: (id: string) => ['binary-data', id, 'blob'] as const,
    objectUrl: (id: string) => ['binary-data', id, 'object-url'] as const,
  },

  expressions: {
    evaluate: (input: EvaluateExpressionInput) =>
      ['expressions', 'evaluate', input] as const,
  },

  /** Server-defined catalogs, identical for every workspace. */
  static: {
    nodeTypes: ['static', 'node-types'] as const,
    credentialTypes: ['static', 'credential-types'] as const,
    expressionReference: ['static', 'expression-reference'] as const,
  },

  health: ['health'] as const,
}
