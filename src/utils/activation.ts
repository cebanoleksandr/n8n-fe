import type { WorkflowGraph } from '../api/types'

/** Triggers that run a workflow by themselves once it is active. */
const ACTIVATABLE_TRIGGERS = ['core.webhook', 'core.schedule']

/**
 * Mirrors the backend's rule (triggers.service.ts): activating needs an
 * enabled Webhook or Schedule node. A Manual Trigger only runs from the editor.
 */
export function canActivate(graph: WorkflowGraph): boolean {
  return graph.nodes.some((node) => !node.disabled && ACTIVATABLE_TRIGGERS.includes(node.type))
}
