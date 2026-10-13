import { useMemo, type FC } from 'react'
import { useColorScheme } from '@mui/material/styles'
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslation } from 'react-i18next'
import type { NodeTypeDescription, WorkflowGraph } from '../../api/types'
import CanvasNode, { type CanvasNodeStatus, type CanvasNodeType } from './CanvasNode'
import { nodeIcon } from './nodeIcons'

const nodeTypes = { workflowNode: CanvasNode }

export interface CanvasRun {
  statuses: Map<string, CanvasNodeStatus>
  /** Items each output emitted, keyed `${nodeId}:${outputIndex}`. */
  itemCounts: Map<string, number>
}

interface IProps {
  graph: WorkflowGraph
  nodeTypeDescriptions: NodeTypeDescription[] | undefined
  /** A run to show on the graph: node statuses and item counts. */
  run?: CanvasRun
  selectedNodeId?: string | null
  onNodeClick?: (nodeId: string) => void
}

/** Read-only view of a workflow graph (the editor will build on it). */
const WorkflowCanvas: FC<IProps> = ({
  graph,
  nodeTypeDescriptions,
  run,
  selectedNodeId,
  onNodeClick,
}) => {
  const { t } = useTranslation()
  const { mode, systemMode } = useColorScheme()
  const colorMode = (mode === 'system' ? systemMode : mode) ?? 'light'

  const nodes = useMemo<CanvasNodeType[]>(() => {
    const descriptions = new Map(nodeTypeDescriptions?.map((d) => [d.type, d]))
    // Outputs actually wired up, for nodes whose outputs depend on parameters.
    const usedOutputs = new Map<string, number>()
    for (const { from } of graph.connections) {
      usedOutputs.set(from.nodeId, Math.max(usedOutputs.get(from.nodeId) ?? 0, from.index + 1))
    }

    return graph.nodes.map((node) => {
      const description = descriptions.get(node.type)
      const outputNames = description?.outputs ?? ['']
      const outputCount = Math.max(outputNames.length, usedOutputs.get(node.id) ?? 0)
      const status = run?.statuses.get(node.id)
      return {
        id: node.id,
        type: 'workflowNode',
        position: { x: node.position[0], y: node.position[1] },
        selected: node.id === selectedNodeId,
        data: {
          name: node.name,
          subtitle: description?.displayName,
          icon: nodeIcon(node.type),
          isTrigger: description?.group === 'trigger',
          disabled: node.disabled,
          inputs: description?.inputs ?? 1,
          // A single output needs no label.
          outputs: Array.from({ length: outputCount }, (_, i) =>
            outputCount > 1 ? (outputNames[i] ?? '') : '',
          ),
          status,
          dimmed: !!run && !status,
        },
      }
    })
  }, [graph, nodeTypeDescriptions, run, selectedNodeId])

  const edges = useMemo<Edge[]>(
    () =>
      graph.connections.map(({ from, to }) => {
        const count = run?.itemCounts.get(`${from.nodeId}:${from.index}`)
        const color =
          count !== undefined && count > 0
            ? 'var(--mui-palette-success-main)'
            : 'var(--mui-palette-text-secondary)'
        return {
          id: `${from.nodeId}:${from.index}->${to.nodeId}:${to.index}`,
          source: from.nodeId,
          sourceHandle: `out-${from.index}`,
          target: to.nodeId,
          targetHandle: `in-${to.index}`,
          label: count !== undefined ? t('executions.items', { count }) : undefined,
          labelStyle: { fill: color, fontSize: 11 },
          labelBgStyle: { fill: 'var(--mui-palette-background-default)' },
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
          animated: run?.statuses.get(to.nodeId) === 'running',
        }
      }),
    [graph, run, t],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      colorMode={colorMode}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.2}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      edgesFocusable={false}
      onNodeClick={(_, node) => onNodeClick?.(node.id)}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <Controls showInteractive={false} position="bottom-left" />
    </ReactFlow>
  )
}

export default WorkflowCanvas
