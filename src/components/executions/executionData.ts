import type { ExecutionStep, StoredItem, WorkflowGraph } from '../../api/types'

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
