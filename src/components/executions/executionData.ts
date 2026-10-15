import type { ExecutionStep, StoredItem, WorkflowGraph } from '../../api/types'
import type { CanvasNodeStatus } from '../workflow-canvas/CanvasNode'
import type { CanvasRun } from '../workflow-canvas/WorkflowCanvas'

/** Milliseconds a step took. */
export function stepDuration(step: ExecutionStep): number {
  return Date.parse(step.finishedAt) - Date.parse(step.startedAt)
}

/** The last run of each node (loops run a node more than once). */
export function lastStepByNode(steps: ExecutionStep[]): Map<string, number> {
  const result = new Map<string, number>()
  steps.forEach((step, index) => result.set(step.nodeId, index))
  return result
}

export interface StepInput {
  /** The node the items came from. */
  fromNodeName: string
  /** Which input of this node they arrived on. */
  inputIndex: number
  items: StoredItem[]
}

/**
 * What a step received: for each incoming connection, the output of the
 * latest run of the source node before this step. Executions store outputs
 * only, so inputs are rebuilt from the graph.
 */
export function stepInputs(
  steps: ExecutionStep[],
  stepIndex: number,
  graph: WorkflowGraph,
): StepInput[] {
  const step = steps[stepIndex]
  // In a loop, a node's second run is fed only by what ran since its first.
  let since = stepIndex - 1
  while (since >= 0 && steps[since].nodeId !== step.nodeId) since--

  const inputs: StepInput[] = []
  for (const connection of graph.connections) {
    if (connection.to.nodeId !== step.nodeId) continue
    let source: ExecutionStep | undefined
    for (let i = stepIndex - 1; i > since; i--) {
      if (steps[i].nodeId === connection.from.nodeId) {
        source = steps[i]
        break
      }
    }
    if (!source) continue
    inputs.push({
      fromNodeName: source.nodeName,
      inputIndex: connection.to.index,
      items: source.output[connection.from.index] ?? [],
    })
  }
  return inputs.sort((a, b) => a.inputIndex - b.inputIndex)
}

/**
 * What the canvas shows for a run: each node's last result and how many
 * items each output sent. `runningNodeId` is the node working right now.
 */
export function canvasRunOf(steps: ExecutionStep[], runningNodeId?: string | null): CanvasRun {
  const statuses = new Map<string, CanvasNodeStatus>()
  const itemCounts = new Map<string, number>()
  for (const [nodeId, index] of lastStepByNode(steps)) {
    const step = steps[index]
    statuses.set(nodeId, step.status)
    step.output.forEach((items, output) => itemCounts.set(`${nodeId}:${output}`, items.length))
  }
  if (runningNodeId) statuses.set(runningNodeId, 'running')
  return { statuses, itemCounts }
}

/**
 * Input of a node for its settings panel: what its last run received, or,
 * if it didn't run, what its parents' latest runs sent it.
 */
export function nodeInputs(
  steps: ExecutionStep[],
  graph: WorkflowGraph,
  nodeId: string,
): StepInput[] {
  const own = steps.findLastIndex((step) => step.nodeId === nodeId)
  if (own >= 0) return stepInputs(steps, own, graph)

  const last = lastStepByNode(steps)
  const inputs: StepInput[] = []
  for (const connection of graph.connections) {
    if (connection.to.nodeId !== nodeId) continue
    const index = last.get(connection.from.nodeId)
    if (index === undefined) continue
    inputs.push({
      fromNodeName: steps[index].nodeName,
      inputIndex: connection.to.index,
      items: steps[index].output[connection.from.index] ?? [],
    })
  }
  return inputs.sort((a, b) => a.inputIndex - b.inputIndex)
}

/** First-output JSON of every node that ran, by name: $('Node') in expressions. */
export function outputsByNodeName(steps: ExecutionStep[]): Record<string, Record<string, unknown>[]> {
  const result: Record<string, Record<string, unknown>[]> = {}
  for (const index of lastStepByNode(steps).values()) {
    const step = steps[index]
    result[step.nodeName] = (step.output[0] ?? []).map((item) => item.json)
  }
  return result
}
