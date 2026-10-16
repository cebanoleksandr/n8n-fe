import type {
  NodeTypeDescription,
  WorkflowConnection,
  WorkflowGraph,
  WorkflowNode,
} from '../../api/types'
import { defaultsOf } from '../../utils/properties'

/** Horizontal step between a node and the one added after it. */
export const NODE_SPACING_X = 220

/**
 * Output names of a node. Mirrors the backend's outputNamesOf(): Switch has
 * one output per rule (named by outputKey or index), plus "fallback".
 */
export function outputNamesOf(
  node: WorkflowNode,
  description: NodeTypeDescription | undefined,
): string[] {
  if (node.type === 'core.switch') {
    const rules = Array.isArray(node.parameters.rules)
      ? (node.parameters.rules as { outputKey?: string }[])
      : []
    const names = rules.map((rule, i) => rule.outputKey || String(i))
    return node.parameters.fallbackOutput === 'extra' ? [...names, 'fallback'] : names
  }
  return description?.outputs ?? ['']
}

/** "HTTP Request", then "HTTP Request1", "HTTP Request2"…: names must be unique. */
export function uniqueName(base: string, nodes: WorkflowNode[]): string {
  const taken = new Set(nodes.map((node) => node.name))
  if (!taken.has(base)) return base
  let n = 1
  while (taken.has(`${base}${n}`)) n++
  return `${base}${n}`
}

/** A new node of `description` with its parameters' defaults. */
export function createNode(
  description: NodeTypeDescription,
  position: [number, number],
  nodes: WorkflowNode[],
): WorkflowNode {
  return {
    id: crypto.randomUUID(),
    name: uniqueName(description.displayName, nodes),
    type: description.type,
    typeVersion: description.version,
    position: [Math.round(position[0]), Math.round(position[1])],
    parameters: {
      ...defaultsOf(description.properties),
      // A webhook is reachable right away, as in n8n: a random, unique path.
      ...(description.type === 'core.webhook' && { path: crypto.randomUUID() }),
    },
  }
}

/** Whether `to` can already reach `from`: the backend rejects cycles. */
export function wouldCreateCycle(graph: WorkflowGraph, fromId: string, toId: string): boolean {
  if (fromId === toId) return true
  const next = new Map<string, string[]>()
  for (const { from, to } of graph.connections) {
    next.set(from.nodeId, [...(next.get(from.nodeId) ?? []), to.nodeId])
  }
  const stack = [toId]
  const seen = new Set<string>()
  while (stack.length) {
    const id = stack.pop()!
    if (id === fromId) return true
    if (seen.has(id)) continue
    seen.add(id)
    stack.push(...(next.get(id) ?? []))
  }
  return false
}

export function sameConnection(a: WorkflowConnection, b: WorkflowConnection): boolean {
  return (
    a.from.nodeId === b.from.nodeId &&
    a.from.index === b.from.index &&
    a.to.nodeId === b.to.nodeId &&
    a.to.index === b.to.index
  )
}

export function connectionId({ from, to }: WorkflowConnection): string {
  return `${from.nodeId}:${from.index}->${to.nodeId}:${to.index}`
}

/** The nodes go, and every connection touching them. */
export function removeNodes(graph: WorkflowGraph, ids: Set<string>): WorkflowGraph {
  return {
    nodes: graph.nodes.filter((node) => !ids.has(node.id)),
    connections: graph.connections.filter(
      (c) => !ids.has(c.from.nodeId) && !ids.has(c.to.nodeId),
    ),
  }
}

/** Where to put a node added without a source: right of everything else. */
export function nextFreePosition(graph: WorkflowGraph): [number, number] {
  if (graph.nodes.length === 0) return [0, 0]
  const rightmost = graph.nodes.reduce((a, b) => (b.position[0] > a.position[0] ? b : a))
  return [rightmost.position[0] + NODE_SPACING_X, rightmost.position[1]]
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Matches $('name') and $("name") in expressions. */
function referencePattern(name: string) {
  return new RegExp(`\\$\\((['"])${escapeRegExp(name)}\\1\\)`, 'g')
}

/** $('name') in the matched quote style; "$" in the name stays literal. */
function referenceReplacement(name: string) {
  return `$$($1${name.replace(/\$/g, '$$$$')}$1)`
}

/** Replaces $('old') / $("old") in every string, however deep. */
function renameReferences(value: unknown, pattern: RegExp, replacement: string): unknown {
  if (typeof value === 'string') return value.replace(pattern, replacement)
  if (Array.isArray(value)) return value.map((item) => renameReferences(item, pattern, replacement))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, renameReferences(item, pattern, replacement)]),
    )
  }
  return value
}

/**
 * Renames a node and the expressions that refer to it by name, so
 * {{ $('Old').item.json }} keeps working, as n8n does.
 */
export function renameNode(graph: WorkflowGraph, nodeId: string, name: string): WorkflowGraph {
  const node = graph.nodes.find((n) => n.id === nodeId)
  if (!node || node.name === name) return graph
  const pattern = referencePattern(node.name)
  const replacement = referenceReplacement(name)
  return {
    ...graph,
    nodes: graph.nodes.map((n) => ({
      ...n,
      name: n.id === nodeId ? name : n.name,
      parameters: renameReferences(n.parameters, pattern, replacement) as Record<string, unknown>,
    })),
  }
}

/** What copying nodes puts on the clipboard (as JSON text). */
export interface ClipboardNodes {
  format: 'flow-nodes@1'
  nodes: WorkflowNode[]
  /** Only those between the copied nodes. */
  connections: WorkflowConnection[]
}

/** The selected nodes and the connections among them. */
export function copyNodes(graph: WorkflowGraph, ids: Set<string>): ClipboardNodes {
  return {
    format: 'flow-nodes@1',
    nodes: graph.nodes.filter((node) => ids.has(node.id)),
    connections: graph.connections.filter((c) => ids.has(c.from.nodeId) && ids.has(c.to.nodeId)),
  }
}

/** Copied nodes from clipboard text, or null for anything else. */
export function parseClipboard(text: string): ClipboardNodes | null {
  try {
    const data = JSON.parse(text) as Partial<ClipboardNodes>
    if (data?.format !== 'flow-nodes@1' || !Array.isArray(data.nodes) || !Array.isArray(data.connections)) {
      return null
    }
    return data as ClipboardNodes
  } catch {
    return null
  }
}

/** How far a paste lands from the copied nodes. */
export const PASTE_OFFSET = 40

/**
 * Adds copied nodes to `graph`: new ids, names made unique (expressions
 * between the pasted nodes follow), shifted so they don't cover what's there.
 * Returns the new graph and the ids of the pasted nodes.
 */
export function pasteNodes(
  graph: WorkflowGraph,
  data: ClipboardNodes,
): { graph: WorkflowGraph; ids: string[] } {
  const ids = new Map(data.nodes.map((node) => [node.id, crypto.randomUUID()]))

  // Shift by the offset, again while the first one would sit on a node.
  const taken = new Set(graph.nodes.map((node) => node.position.join(',')))
  const first = data.nodes[0]
  let shift = PASTE_OFFSET
  while (first && taken.has([first.position[0] + shift, first.position[1] + shift].join(','))) {
    shift += PASTE_OFFSET
  }

  let pasted: WorkflowNode[] = []
  const renames: [string, string][] = []
  for (const node of data.nodes) {
    const name = uniqueName(node.name, [...graph.nodes, ...pasted])
    if (name !== node.name) renames.push([node.name, name])
    pasted.push({
      ...node,
      id: ids.get(node.id)!,
      name,
      position: [node.position[0] + shift, node.position[1] + shift],
    })
  }

  // A pasted node referring to another pasted one by name keeps doing so.
  for (const [from, to] of renames) {
    pasted = pasted.map((node) => ({
      ...node,
      parameters: renameReferences(node.parameters, referencePattern(from), referenceReplacement(to)) as Record<
        string,
        unknown
      >,
    }))
  }

  const connections = data.connections
    .filter((c) => ids.has(c.from.nodeId) && ids.has(c.to.nodeId))
    .map((c) => ({
      from: { nodeId: ids.get(c.from.nodeId)!, index: c.from.index },
      to: { nodeId: ids.get(c.to.nodeId)!, index: c.to.index },
    }))

  return {
    graph: { nodes: [...graph.nodes, ...pasted], connections: [...graph.connections, ...connections] },
    ids: pasted.map((node) => node.id),
  }
}
