import { describe, expect, it } from 'vitest'
import type { ExecutionStep, StoredItem, WorkflowGraph } from '../../api/types'
import {
  canvasRunOf,
  lastStepByNode,
  nodeInputs,
  outputsByNodeName,
  stepDuration,
  stepInputs,
} from './executionData'

const items = (n: number): StoredItem[] => Array.from({ length: n }, (_, i) => ({ json: { i } }))

function step(nodeId: string, output: StoredItem[][], extra: Partial<ExecutionStep> = {}): ExecutionStep {
  return {
    nodeId,
    nodeName: nodeId.toUpperCase(),
    status: 'success',
    output,
    error: null,
    tries: 1,
    pinned: false,
    startedAt: '2026-10-13T10:00:00.000Z',
    finishedAt: '2026-10-13T10:00:00.038Z',
    ...extra,
  }
}

const link = (from: string, to: string, fromIndex = 0, toIndex = 0) => ({
  from: { nodeId: from, index: fromIndex },
  to: { nodeId: to, index: toIndex },
})

// trigger -> if (true: a, false: b); a and b -> merge (inputs 0 and 1); merge -> a
const graph: WorkflowGraph = {
  nodes: [],
  connections: [
    link('t', 'if'),
    link('if', 'a', 0),
    link('if', 'b', 1),
    link('b', 'm', 0, 1),
    link('a', 'm', 0, 0),
    link('m', 'a'),
  ],
}

const steps = [
  step('t', [items(5)]),
  step('if', [items(3), items(2)]),
  step('a', [items(3)]),
  step('b', [items(2)]),
  step('m', [items(5)]),
  // a runs again, fed by m
  step('a', [items(5)]),
]

const summary = (inputs: ReturnType<typeof stepInputs>) =>
  inputs.map((input) => [input.fromNodeName, input.inputIndex, input.items.length])

describe('stepInputs', () => {
  it('is empty for the trigger', () => {
    expect(stepInputs(steps, 0, graph)).toEqual([])
  })

  it('takes the output a connection comes from (If true / false)', () => {
    expect(summary(stepInputs(steps, 2, graph))).toEqual([['IF', 0, 3]])
    expect(summary(stepInputs(steps, 3, graph))).toEqual([['IF', 0, 2]])
  })

  it('lists several inputs in input order', () => {
    expect(summary(stepInputs(steps, 4, graph))).toEqual([
      ['A', 0, 3],
      ['B', 1, 2],
    ])
  })

  it('feeds a second run only with what ran since the first', () => {
    expect(summary(stepInputs(steps, 5, graph))).toEqual([['M', 0, 5]])
  })
})

describe('nodeInputs', () => {
  it('uses the node’s own last run when it ran', () => {
    expect(summary(nodeInputs(steps, graph, 'm'))).toEqual([
      ['A', 0, 3],
      ['B', 1, 2],
    ])
  })

  it('falls back to the parents’ latest output when it did not run', () => {
    const partial = steps.slice(0, 2)
    expect(summary(nodeInputs(partial, graph, 'b'))).toEqual([['IF', 0, 2]])
  })
})

describe('run summaries', () => {
  it('finds the last run of each node', () => {
    expect(lastStepByNode(steps).get('a')).toBe(5)
  })

  it('measures a step', () => {
    expect(stepDuration(steps[0])).toBe(38)
  })

  it('gives first-output JSON by node name, for $() in expressions', () => {
    expect(outputsByNodeName([step('t', [[{ json: { x: 1 } }], [{ json: { y: 2 } }]])])).toEqual({
      T: [{ x: 1 }],
    })
  })

  it('marks statuses, item counts and the running node for the canvas', () => {
    const run = canvasRunOf([step('t', [items(2)]), step('if', [items(1), items(0)], { status: 'error' })], 'a')
    expect(Object.fromEntries(run.statuses)).toEqual({ t: 'success', if: 'error', a: 'running' })
    expect(Object.fromEntries(run.itemCounts)).toEqual({ 't:0': 2, 'if:0': 1, 'if:1': 0 })
  })
})
