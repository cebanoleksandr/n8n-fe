import { describe, expect, it } from 'vitest'
import type { WorkflowGraph } from '../../api/types'
import { COALESCE_MS, emptyHistory, HISTORY_LIMIT, recordEdit, redo, undo } from './graphHistory'

const g = (name: string): WorkflowGraph => ({
  nodes: [{ id: 'a', name, type: 'core.set', typeVersion: 1, position: [0, 0], parameters: {} }],
  connections: [],
})
const names = (graphs: WorkflowGraph[]) => graphs.map((graph) => graph.nodes[0].name)

describe('graph history', () => {
  it('undoes and redoes edits in order', () => {
    let history = recordEdit(emptyHistory(), g('v1'), 1_000)
    history = recordEdit(history, g('v2'), 5_000)
    // Current is v3.
    const back = undo(history, g('v3'))!
    expect(back.graph.nodes[0].name).toBe('v2')
    const again = undo(back.history, back.graph)!
    expect(again.graph.nodes[0].name).toBe('v1')
    expect(undo(again.history, again.graph)).toBeNull()

    const forward = redo(again.history, again.graph)!
    expect(forward.graph.nodes[0].name).toBe('v2')
    expect(names(forward.history.future)).toEqual(['v3'])
  })

  it('makes quick continuous edits (a drag, typing) one step', () => {
    let history = recordEdit(emptyHistory(), g('start'), 1_000, true)
    history = recordEdit(history, g('mid1'), 1_000 + COALESCE_MS / 2, true)
    history = recordEdit(history, g('mid2'), 1_000 + COALESCE_MS, true)
    expect(names(history.past)).toEqual(['start'])
  })

  it('keeps quick discrete edits (paste, cut) as separate steps', () => {
    let history = recordEdit(emptyHistory(), g('v1'), 1_000)
    history = recordEdit(history, g('v2'), 1_010)
    // A drag right after a paste is its own step too.
    history = recordEdit(history, g('v3'), 1_020, true)
    expect(names(history.past)).toEqual(['v1', 'v2', 'v3'])
  })

  it('starts a new step after an undo, however quick', () => {
    let history = recordEdit(emptyHistory(), g('v1'), 1_000)
    history = undo(history, g('v2'))!.history
    history = recordEdit(history, g('v1'), 1_010, true)
    history = recordEdit(history, g('v1b'), 1_020, true)
    expect(names(history.past)).toEqual(['v1'])
    expect(history.future).toEqual([])
  })

  it('forgets what could be redone once something new is edited', () => {
    let history = recordEdit(emptyHistory(), g('v1'), 1_000)
    history = undo(history, g('v2'))!.history
    expect(history.future).toHaveLength(1)
    history = recordEdit(history, g('v1'), 9_000)
    expect(history.future).toEqual([])
  })

  it('keeps at most the limit of steps', () => {
    let history = emptyHistory()
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) history = recordEdit(history, g(`v${i}`), i * 10_000)
    expect(history.past).toHaveLength(HISTORY_LIMIT)
    expect(history.past[0].nodes[0].name).toBe('v5')
  })
})
