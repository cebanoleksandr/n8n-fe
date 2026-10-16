// Mirrors the backend DTOs (backend/src/modules/**/*.dto.ts). Dates arrive as ISO strings.

export type IsoDate = string

export interface Page<T> {
  items: T[]
  total: number
}

export interface PaginationParams {
  limit?: number
  offset?: number
}

/** Body of every non-2xx response from Nest. */
export interface ApiErrorBody {
  statusCode?: number
  message: string | string[]
  error?: string
  /** ZodValidationPipe failures. */
  issues?: { path: string; message: string }[]
  /** 429 from login. */
  retryAfter?: number
}

// ---------------------------------------------------------------------------
// Auth & workspaces
// ---------------------------------------------------------------------------

export const ROLES = ['viewer', 'editor', 'admin', 'owner'] as const
export type Role = (typeof ROLES)[number]

export function hasRole(actual: Role, required: Role): boolean {
  return ROLES.indexOf(actual) >= ROLES.indexOf(required)
}

export interface User {
  id: string
  email: string
  name: string
}

export interface Session {
  accessToken: string
  /** Seconds until the access token expires. */
  expiresIn: number
  user: User
}

export interface Membership {
  workspaceId: string
  workspaceName: string
  role: Role
}

export interface Me extends User {
  workspaces: Membership[]
}

/** Sign-up: creates the account and a workspace it owns. */
export interface RegisterInput {
  email: string
  name: string
  /** At least 8 characters. */
  password: string
  /** Defaults to "<name>'s workspace". */
  workspaceName?: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface InvitationInfo {
  email: string
  role: Role
  workspaceName: string
  expiresAt: IsoDate
  hasAccount: boolean
}

export interface AcceptInvitationInput {
  /** Required for new accounts. */
  name?: string
  password: string
}

export interface Workspace {
  id: string
  name: string
  role: Role
}

export interface Member {
  userId: string
  email: string
  name: string
  role: Role
  joinedAt: IsoDate
}

export interface Invitation {
  id: string
  email: string
  role: Role
  expiresAt: IsoDate
  createdAt: IsoDate
}

/** The raw token is returned only once, on creation. */
export interface CreatedInvitation extends Invitation {
  token: string
}

// ---------------------------------------------------------------------------
// Workflow graph & node types (backend/src/engine/types.ts)
// ---------------------------------------------------------------------------

export interface WorkflowNode {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: Record<string, unknown>
  continueOnFail?: boolean
  disabled?: boolean
  /** Credential type -> credential id. */
  credentials?: Record<string, string>
  retryOnFail?: boolean
  maxTries?: number
  waitBetweenTriesMs?: number
}

export interface ConnectionEndpoint {
  nodeId: string
  index: number
}

export interface WorkflowConnection {
  from: ConnectionEndpoint
  to: ConnectionEndpoint
}

export interface WorkflowGraph {
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
}

export type PropertyType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'options'
  | 'json'
  | 'code'
  | 'list'

export interface PropertyOption {
  name: string
  value: string | number | boolean
}

export interface PropertySchema {
  name: string
  displayName: string
  type: PropertyType
  default: unknown
  required?: boolean
  description?: string
  placeholder?: string
  options?: PropertyOption[]
  itemProperties?: PropertySchema[]
  displayOptions?: { show: Record<string, unknown[]> }
  secret?: boolean
}

export type NodeGroup = 'trigger' | 'action' | 'transform' | 'flow'

export interface NodeCredentialDescription {
  type: string
  required?: boolean
  displayOptions?: { show: Record<string, unknown[]> }
}

export interface NodeTypeDescription {
  type: string
  version: number
  displayName: string
  description: string
  group: NodeGroup
  inputs: number
  outputs: string[]
  dynamicOutputs?: string
  properties: PropertySchema[]
  credentials?: NodeCredentialDescription[]
}

export interface CredentialTypeDescription {
  type: string
  displayName: string
  properties: PropertySchema[]
  oauth2?: boolean
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

export type PinData = Record<string, Record<string, unknown>[]>

export interface WorkflowSettings {
  errorWorkflowId?: string | null
  timeoutSeconds?: number | null
}

export interface WorkflowSummary {
  id: string
  name: string
  active: boolean
  createdAt: IsoDate
  updatedAt: IsoDate
}

export interface Workflow extends WorkflowSummary {
  settings: WorkflowSettings
  pinData: PinData
  versionId: string
  version: number
  graph: WorkflowGraph
}

export const WORKFLOW_SORTS = [
  'updatedAt:desc',
  'createdAt:desc',
  'name:asc',
  'name:desc',
] as const
export type WorkflowSort = (typeof WORKFLOW_SORTS)[number]

export interface ListWorkflowsParams extends PaginationParams {
  /** Case-insensitive part of the name. */
  search?: string
  /** Defaults to 'updatedAt:desc'. */
  sort?: WorkflowSort
}

export interface CreateWorkflowInput {
  name: string
  graph?: WorkflowGraph
}

/** Omitted fields are kept; a settings field set to null is cleared. */
export interface UpdateWorkflowInput {
  name?: string
  active?: boolean
  /** A change to the logic is a new version; moved nodes update the current one. */
  graph?: WorkflowGraph
  settings?: WorkflowSettings
  /** Replaces all pinned data; {} unpins everything. */
  pinData?: PinData
}

export interface WorkflowVersion {
  id: string
  version: number
  createdAt: IsoDate
}

export interface WorkflowVersionWithGraph extends WorkflowVersion {
  graph: WorkflowGraph
}

export interface WorkflowExport {
  format: 'flow-workflow@1'
  name: string
  graph: WorkflowGraph
  settings: { timeoutSeconds?: number }
  pinData: PinData
}

export interface WorkflowImport {
  format?: 'flow-workflow@1'
  name: string
  graph: WorkflowGraph
  settings?: { timeoutSeconds?: number }
  pinData?: PinData
}

/** GET /webhooks/urls: a Webhook node answers at <base>/<path>. */
export interface WebhookUrls {
  production: string
  test: string
}

export interface TestWebhookListening {
  webhooks: { nodeId: string; method: string; path: string }[]
  expiresInSeconds: number
}

// ---------------------------------------------------------------------------
// Executions
// ---------------------------------------------------------------------------

export const EXECUTION_STATUSES = [
  'queued',
  'running',
  'waiting',
  'success',
  'error',
  'canceled',
] as const
export type ExecutionStatus = (typeof EXECUTION_STATUSES)[number]

export type ExecutionMode =
  | 'manual'
  | 'webhook'
  | 'schedule'
  | 'error'
  | 'subworkflow'

export function isFinished(status: ExecutionStatus): boolean {
  return status !== 'queued' && status !== 'running' && status !== 'waiting'
}

export interface ExecutionError {
  name: string
  message: string
  nodeId?: string
  itemIndex?: number
}

export interface BinaryRef {
  id: string
  fileName?: string
  mimeType: string
  size: number
}

export interface StoredItem {
  json: Record<string, unknown>
  binary?: Record<string, BinaryRef>
}

export interface ExecutionSummary {
  id: string
  workflowId: string
  /** The workflow's current name. */
  workflowName: string
  workflowVersionId: string
  status: ExecutionStatus
  mode: ExecutionMode
  parentExecutionId: string | null
  error: ExecutionError | null
  createdAt: IsoDate
  startedAt: IsoDate | null
  finishedAt: IsoDate | null
  waitTill: IsoDate | null
}

export interface ExecutionStep {
  nodeId: string
  nodeName: string
  status: 'success' | 'error'
  /** One item array per node output. */
  output: StoredItem[][]
  error: ExecutionError | null
  tries: number
  pinned: boolean
  startedAt: IsoDate
  finishedAt: IsoDate
}

export interface Execution extends ExecutionSummary {
  steps: ExecutionStep[]
}

export interface ListExecutionsParams extends PaginationParams {
  workflowId?: string
  status?: ExecutionStatus
}

export interface RunWorkflowInput {
  /** Trigger node to start from; defaults to the first trigger. */
  startNodeId?: string
  /** Items for the trigger node. */
  input?: Record<string, unknown>[]
  /** Run only this node and the nodes it depends on. */
  destinationNodeId?: string
  /** Re-run from this node with the outputs of an earlier run. */
  runFromNodeId?: string
  sourceExecutionId?: string
}

/** Pushed over the `/executions` socket. Node output is not included. */
export type ExecutionEvent = { executionId: string; workflowId: string } & (
  | { type: 'execution.queued'; mode: ExecutionMode; createdAt: IsoDate }
  | { type: 'execution.started'; startedAt: IsoDate }
  | { type: 'execution.waiting'; waitTill: IsoDate }
  | {
      type: 'execution.response'
      statusCode: number
      headers: Record<string, string>
      body?: unknown
      binary?: BinaryRef
    }
  | { type: 'node.started'; nodeId: string }
  | {
      type: 'node.finished'
      nodeId: string
      nodeName: string
      status: 'success' | 'error'
      error: ExecutionError | null
      itemCounts: number[]
    }
  | {
      type: 'execution.finished'
      status: ExecutionStatus
      error: ExecutionError | null
      finishedAt: IsoDate
    }
)

// ---------------------------------------------------------------------------
// Credentials
// ---------------------------------------------------------------------------

export interface Credential {
  id: string
  name: string
  type: string
  /** Non-secret fields only. */
  data: Record<string, unknown>
  oauth2?: { connected: boolean; expiresAt: IsoDate | null }
  createdAt: IsoDate
  updatedAt: IsoDate
}

export interface CreateCredentialInput {
  name: string
  type: string
  data: Record<string, unknown>
}

export interface UpdateCredentialInput {
  name?: string
  /** Merged into the stored data: omitted fields keep their values. */
  data?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Expressions
// ---------------------------------------------------------------------------

export interface ReferenceEntry {
  name: string
  signature: string
  description: string
}

export interface ExpressionReference {
  variables: ReferenceEntry[]
  functions: ReferenceEntry[]
  methods: {
    string: ReferenceEntry[]
    number: ReferenceEntry[]
    array: ReferenceEntry[]
  }
  properties: { string: ReferenceEntry[]; array: ReferenceEntry[] }
}

export interface EvaluateExpressionInput {
  /** Parameter value as typed, e.g. "Hi {{ $json.name }}". */
  expression: string
  json?: Record<string, unknown>
  binary?: Record<string, unknown>
  itemIndex?: number
  /** Outputs of earlier nodes by name (first output, JSON only). */
  nodes?: Record<string, Record<string, unknown>[]>
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export interface HealthReady {
  status: 'ok' | 'unavailable'
  checks: Record<string, string>
}
