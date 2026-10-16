import { describe, expect, it } from 'vitest'
import type { NodeTypeDescription, WorkflowGraph, WorkflowNode } from '../../api/types'
import {
  connectionId,
  copyNodes,
  createNode,
  nextFreePosition,
  NODE_SPACING_X,
  outputNamesOf,
  parseClipboard,
  PASTE_OFFSET,
  pasteNodes,
  removeNodes,
  renameNode,
  sameConnection,
  uniqueName,
  wouldCreateCycle,
} from './graph'

function node(id: string, extra: Partial<WorkflowNode> = {}): WorkflowNode {
  return {
    id,
    name: id.toUpperCase(),
    type: 'core.set',
    typeVersion: 1,
    position: [0, 0],
    parameters: {},
    ...extra,
  }
}

function link(from: string, to: string, fromIndex = 0, toIndex = 0) {
  return { from: { nodeId: from, index: fromIndex }, to: { nodeId: to, index: toIndex } }
}

const description = (extra: Partial<NodeTypeDescription>): NodeTypeDescription => ({
  type: 'core.set',
  version: 2,
  displayName: 'Set',
  description: '',
  group: 'transform',
  inputs: 1,
  outputs: ['main'],
  properties: [],
  ...extra,
})

describe('outputNamesOf', () => {
  it('uses the node type outputs', () => {
    expect(outputNamesOf(node('a', { type: 'core.if' }), description({ outputs: ['true', 'false'] }))).toEqual([
      'true',
      'false',
    ])
  })

  it('falls back to one unnamed output without a description', () => {
    expect(outputNamesOf(node('a'), undefined)).toEqual([''])
  })

  it('gives Switch one output per rule, named by outputKey or index, plus fallback', () => {
    const sw = node('s', {
      type: 'core.switch',
      parameters: { rules: [{ outputKey: 'remind' }, {}, { outputKey: 'close' }], fallbackOutput: 'extra' },
    })
    expect(outputNamesOf(sw, description({ outputs: [] }))).toEqual(['remind', '1', 'close', 'fallback'])
  })

  it('gives Switch no outputs without rules', () => {
    expect(outputNamesOf(node('s', { type: 'core.switch' }), undefined)).toEqual([])
  })
})

describe('uniqueName', () => {
  it('keeps a free name and numbers a taken one', () => {
    const nodes = [node('a', { name: 'Set' }), node('b', { name: 'Set1' })]
    expect(uniqueName('Code', nodes)).toBe('Code')
    expect(uniqueName('Set', nodes)).toBe('Set2')
  })
})

describe('createNode', () => {
  it('fills parameter defaults, the type version and a rounded position', () => {
    const created = createNode(
      description({
        properties: [
          { name: 'assignments', displayName: 'Fields', type: 'list', default: [] },
          { name: 'keep', displayName: 'Keep', type: 'boolean', default: true },
        ],
      }),
      [100.4, 20.6],
      [node('x', { name: 'Set' })],
    )
    expect(created).toMatchObject({
      name: 'Set1',
      type: 'core.set',
      typeVersion: 2,
      position: [100, 21],
      parameters: { assignments: [], keep: true },
    })
    expect(created.id).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('gives a new Webhook a random path the backend accepts', () => {
    const webhook = createNode(description({ type: 'core.webhook', displayName: 'Webhook' }), [0, 0], [])
    expect(webhook.parameters.path).toMatch(/^[A-Za-z0-9_-]+$/)
  })
})

describe('wouldCreateCycle', () => {
  const graph: WorkflowGraph = { nodes: [node('a'), node('b'), node('c')], connections: [link('a', 'b'), link('b', 'c')] }

  it('detects a connection back up the chain', () => {
    expect(wouldCreateCycle(graph, 'c', 'a')).toBe(true)
  })

  it('allows a connection down the chain', () => {
    expect(wouldCreateCycle(graph, 'a', 'c')).toBe(false)
  })

  it('rejects a node connected to itself', () => {
    expect(wouldCreateCycle(graph, 'a', 'a')).toBe(true)
  })
})

describe('connections', () => {
  it('compares and identifies connections by both ends and indexes', () => {
    expect(sameConnection(link('a', 'b', 1), link('a', 'b', 1))).toBe(true)
    expect(sameConnection(link('a', 'b', 1), link('a', 'b', 0))).toBe(false)
    expect(connectionId(link('a', 'b', 1, 0))).toBe('a:1->b:0')
  })
})

describe('removeNodes', () => {
  it('drops the nodes and every connection touching them', () => {
    const graph: WorkflowGraph = { nodes: [node('a'), node('b'), node('c')], connections: [link('a', 'b'), link('b', 'c')] }
    expect(removeNodes(graph, new Set(['b']))).toEqual({ nodes: [node('a'), node('c')], connections: [] })
  })
})

describe('nextFreePosition', () => {
  it('starts at the origin and then goes right of the rightmost node', () => {
    expect(nextFreePosition({ nodes: [], connections: [] })).toEqual([0, 0])
    const graph: WorkflowGraph = {
      nodes: [node('a', { position: [0, 0] }), node('b', { position: [300, 40] })],
      connections: [],
    }
    expect(nextFreePosition(graph)).toEqual([300 + NODE_SPACING_X, 40])
  })
})

describe('renameNode', () => {
  const graph: WorkflowGraph = {
    connections: [],
    nodes: [
      node('a', { name: 'Get (Jobs) $1' }),
      node('b', {
        name: 'Use',
        parameters: {
          text: `Hi {{ $('Get (Jobs) $1').item.json.x }} and {{ $("Get (Jobs) $1").first() }}`,
          other: `{{ $('Get (Jobs) $1 extra').item }}`,
          list: [{ value: `{{ $('Get (Jobs) $1').all() }}` }],
        },
      }),
    ],
  }
  const renamed = renameNode(graph, 'a', 'Fetch $& $$ jobs')

  it('renames the node', () => {
    expect(renamed.nodes[0].name).toBe('Fetch $& $$ jobs')
  })

  it('updates references in both quote styles, however deep', () => {
    expect(renamed.nodes[1].parameters.text).toBe(
      `Hi {{ $('Fetch $& $$ jobs').item.json.x }} and {{ $("Fetch $& $$ jobs").first() }}`,
    )
    expect(renamed.nodes[1].parameters.list).toEqual([{ value: `{{ $('Fetch $& $$ jobs').all() }}` }])
  })

  it('leaves a node with a longer, similar name alone', () => {
    expect(renamed.nodes[1].parameters.other).toBe(`{{ $('Get (Jobs) $1 extra').item }}`)
  })

  it('returns the same graph when the name does not change', () => {
    expect(renameNode(graph, 'a', 'Get (Jobs) $1')).toBe(graph)
  })
})

describe('copy and paste', () => {
  const graph: WorkflowGraph = {
    nodes: [
      node('t', { name: 'Trigger', position: [0, 0] }),
      node('a', { name: 'Fetch', position: [200, 0] }),
      node('b', { name: 'Use', position: [400, 0], parameters: { text: `{{ $('Fetch').item.json.x }}` } }),
    ],
    connections: [link('t', 'a'), link('a', 'b')],
  }

  it('copies the selected nodes and only the connections between them', () => {
    const copied = copyNodes(graph, new Set(['a', 'b']))
    expect(copied.nodes.map((n) => n.id)).toEqual(['a', 'b'])
    expect(copied.connections).toEqual([link('a', 'b')])
  })

  it('reads its own clipboard text and nothing else', () => {
    const copied = copyNodes(graph, new Set(['a']))
    expect(parseClipboard(JSON.stringify(copied))).toEqual(copied)
    expect(parseClipboard('hello')).toBeNull()
    expect(parseClipboard(JSON.stringify({ nodes: [], connections: [] }))).toBeNull()
  })

  it('pastes with new ids, unique names, shifted, and keeps expressions between pasted nodes', () => {
    const { graph: next, ids } = pasteNodes(graph, copyNodes(graph, new Set(['a', 'b'])))
    const pasted = next.nodes.filter((n) => ids.includes(n.id))

    expect(ids).toHaveLength(2)
    expect(ids).not.toContain('a')
    expect(pasted.map((n) => n.name)).toEqual(['Fetch1', 'Use1'])
    expect(pasted[0].position).toEqual([200 + PASTE_OFFSET, PASTE_OFFSET])
    // Use1 now reads from Fetch1, its pasted partner.
    expect(pasted[1].parameters.text).toBe(`{{ $('Fetch1').item.json.x }}`)
    expect(next.connections.at(-1)).toEqual(link(ids[0], ids[1]))
    // The originals are untouched.
    expect(next.nodes.slice(0, 3)).toEqual(graph.nodes)
  })

  it('shifts a second paste further, instead of stacking on the first', () => {
    const copied = copyNodes(graph, new Set(['a']))
    const once = pasteNodes(graph, copied).graph
    const twice = pasteNodes(once, copied)
    const second = twice.graph.nodes.find((n) => n.id === twice.ids[0])!
    expect(second.position).toEqual([200 + 2 * PASTE_OFFSET, 2 * PASTE_OFFSET])
    expect(second.name).toBe('Fetch2')
  })
})
