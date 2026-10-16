import { describe, expect, it } from 'vitest'
import type { WorkflowNode } from '../api/types'
import { canActivate } from './activation'

const node = (type: string, disabled?: boolean): WorkflowNode => ({
  id: type,
  name: type,
  type,
  typeVersion: 1,
  position: [0, 0],
  parameters: {},
  disabled,
})

describe('canActivate', () => {
  it('needs an enabled Webhook or Schedule node, as the backend does', () => {
    expect(canActivate({ nodes: [node('core.webhook')], connections: [] })).toBe(true)
    expect(canActivate({ nodes: [node('core.schedule')], connections: [] })).toBe(true)
    expect(canActivate({ nodes: [node('core.manualTrigger')], connections: [] })).toBe(false)
    expect(canActivate({ nodes: [node('core.webhook', true)], connections: [] })).toBe(false)
  })
})
