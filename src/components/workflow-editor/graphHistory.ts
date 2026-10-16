import type { WorkflowGraph } from '../../api/types'

/** Undo / redo stacks of the editor's graph. */
export interface GraphHistory {
  past: WorkflowGraph[]
  future: WorkflowGraph[]
  /** When the last edit was recorded (ms), for coalescing. */
  lastEditAt: number
}

/** Edits closer together than this are one undo step: a drag, typing a word. */
export const COALESCE_MS = 600
/** Oldest steps beyond this are forgotten. */
export const HISTORY_LIMIT = 100

export const emptyHistory = (): GraphHistory => ({ past: [], future: [], lastEditAt: 0 })

/**
 * Records that `before` is about to be replaced by an edit at `now`. A new
 * edit clears what could be redone. `continuous` edits (a drag, typing in a
 * field) close together are one step; any other edit is a step of its own.
 */
export function recordEdit(
  history: GraphHistory,
  before: WorkflowGraph,
  now: number,
  continuous = false,
): GraphHistory {
  const coalesce = continuous && history.past.length > 0 && now - history.lastEditAt < COALESCE_MS
  return {
    past: coalesce ? history.past : [...history.past, before].slice(-HISTORY_LIMIT),
    future: [],
    // A discrete edit is never the start of a coalesced run.
    lastEditAt: continuous ? now : 0,
  }
}

/** The graph to go back to, or null when there is nothing to undo. */
export function undo(history: GraphHistory, current: WorkflowGraph): { history: GraphHistory; graph: WorkflowGraph } | null {
  const graph = history.past.at(-1)
  if (!graph) return null
  return {
    graph,
    // lastEditAt 0: the next edit starts its own step.
    history: { past: history.past.slice(0, -1), future: [current, ...history.future], lastEditAt: 0 },
  }
}

export function redo(history: GraphHistory, current: WorkflowGraph): { history: GraphHistory; graph: WorkflowGraph } | null {
  const [graph, ...future] = history.future
  if (!graph) return null
  return {
    graph,
    history: { past: [...history.past, current].slice(-HISTORY_LIMIT), future, lastEditAt: 0 },
  }
}
