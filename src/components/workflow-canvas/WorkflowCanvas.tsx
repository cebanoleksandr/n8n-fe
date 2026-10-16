import { useMemo, useRef, useState, type FC } from 'react'
import { useColorScheme } from '@mui/material/styles'
import {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  type EdgeChange,
  MarkerType,
  type NodeChange,
  type OnConnectEnd,
  ReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTranslation } from 'react-i18next'
import type {
  ConnectionEndpoint,
  NodeTypeDescription,
  WorkflowConnection,
  WorkflowGraph,
} from '../../api/types'
import CanvasEdge, { type CanvasEdgeType } from './CanvasEdge'
import CanvasNode, { type CanvasNodeStatus, type CanvasNodeType } from './CanvasNode'
import {
  connectionId,
  outputNamesOf,
  removeNodes,
  sameConnection,
  wouldCreateCycle,
} from './graph'
import { nodeIcon } from './nodeIcons'

const nodeTypes = { workflowNode: CanvasNode }
const edgeTypes = { workflowEdge: CanvasEdge }

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
  onNodeDoubleClick?: (nodeId: string) => void
  /** Makes the canvas editable: moves, connections and deletions come back here. */
  onGraphChange?: (graph: WorkflowGraph) => void
  /** The "+" on a free output: add a node after it. */
  onAddFrom?: (source: ConnectionEndpoint) => void
  /** Nodes whose output is pinned for test runs: they get a pin. */
  pinnedNodeIds?: Set<string>
}

/** "out-2" / "in-0" -> 2 / 0. */
function handleIndex(handle: string | null | undefined): number {
  return Number(handle?.split('-')[1] ?? 0)
}

function toConnection(connection: Connection): WorkflowConnection {
  return {
    from: { nodeId: connection.source, index: handleIndex(connection.sourceHandle) },
    to: { nodeId: connection.target, index: handleIndex(connection.targetHandle) },
  }
}

/** A workflow graph: read-only (executions) or editable (the editor). */
const WorkflowCanvas: FC<IProps> = ({
  graph,
  nodeTypeDescriptions,
  run,
  selectedNodeId,
  onNodeClick,
  onNodeDoubleClick,
  onGraphChange,
  onAddFrom,
  pinnedNodeIds,
}) => {
  const { t } = useTranslation()
  const { mode, systemMode } = useColorScheme()
  const colorMode = (mode === 'system' ? systemMode : mode) ?? 'light'
  const editable = !!onGraphChange

  // React Flow reads sizes from node.measured: nodes rebuilt without them get
  // measured again, which makes edges flicker while dragging.
  const [measured, setMeasured] = useState(new Map<string, { width: number; height: number }>())
  const [selectedNodes, setSelectedNodes] = useState(new Set<string>())
  const [selectedEdges, setSelectedEdges] = useState(new Set<string>())

  const nodes = useMemo<CanvasNodeType[]>(() => {
    const descriptions = new Map(nodeTypeDescriptions?.map((d) => [d.type, d]))
    const usedOutputs = new Set(graph.connections.map((c) => `${c.from.nodeId}:${c.from.index}`))

    return graph.nodes.map((node) => {
      const description = descriptions.get(node.type)
      const outputNames = outputNamesOf(node, description)
      const status = run?.statuses.get(node.id)
      return {
        id: node.id,
        type: 'workflowNode',
        position: { x: node.position[0], y: node.position[1] },
        measured: measured.get(node.id),
        selected: node.id === selectedNodeId || selectedNodes.has(node.id),
        data: {
          name: node.name,
          subtitle: description?.displayName,
          icon: nodeIcon(node.type),
          isTrigger: description?.group === 'trigger',
          disabled: node.disabled,
          inputs: description?.inputs ?? 1,
          // A single output needs no label.
          outputs: outputNames.map((name) => (outputNames.length > 1 ? name : '')),
          status,
          dimmed: !!run && !status,
          pinned: pinnedNodeIds?.has(node.id),
          editable,
          freeOutputs: outputNames.map((_, i) => !usedOutputs.has(`${node.id}:${i}`)),
          onAddFrom: onAddFrom && ((index: number) => onAddFrom({ nodeId: node.id, index })),
        },
      }
    })
  }, [graph, nodeTypeDescriptions, run, selectedNodeId, selectedNodes, measured, editable, onAddFrom, pinnedNodeIds])

  const removeConnection = (id: string) =>
    onGraphChange?.({ ...graph, connections: graph.connections.filter((c) => connectionId(c) !== id) })

  const edges = useMemo<CanvasEdgeType[]>(
    () =>
      graph.connections.map((connection) => {
        const { from, to } = connection
        const id = connectionId(connection)
        const count = run?.itemCounts.get(`${from.nodeId}:${from.index}`)
        const selected = selectedEdges.has(id)
        const color = selected
          ? 'var(--mui-palette-primary-main)'
          : count !== undefined && count > 0
            ? 'var(--mui-palette-success-main)'
            : 'var(--mui-palette-text-secondary)'
        return {
          id,
          type: 'workflowEdge',
          source: from.nodeId,
          sourceHandle: `out-${from.index}`,
          target: to.nodeId,
          targetHandle: `in-${to.index}`,
          selected,
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
          animated: run?.statuses.get(to.nodeId) === 'running',
          data: {
            label: count !== undefined ? t('executions.items', { count }) : undefined,
            color,
            onDelete: editable ? () => removeConnection(id) : undefined,
            deleteLabel: t('editor.deleteConnection'),
          },
        }
      }),
    // removeConnection only reads graph, which is listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph, run, selectedEdges, t, editable],
  )

  const handleNodesChange = (changes: NodeChange<CanvasNodeType>[]) => {
    const sizes = changes.filter((c) => c.type === 'dimensions' && c.dimensions)
    if (sizes.length) {
      setMeasured((current) => {
        const next = new Map(current)
        for (const change of sizes) {
          if (change.type === 'dimensions' && change.dimensions) next.set(change.id, change.dimensions)
        }
        return next
      })
    }
    if (!editable) return

    const selects = changes.filter((c) => c.type === 'select')
    if (selects.length) {
      setSelectedNodes((current) => {
        const next = new Set(current)
        for (const change of selects) {
          if (change.type !== 'select') continue
          if (change.selected) next.add(change.id)
          else next.delete(change.id)
        }
        return next
      })
    }

    const moves = new Map<string, [number, number]>()
    const removed = new Set<string>()
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        moves.set(change.id, [Math.round(change.position.x), Math.round(change.position.y)])
      }
      if (change.type === 'remove') removed.add(change.id)
    }
    if (!moves.size && !removed.size) return

    let next: WorkflowGraph = moves.size
      ? {
          ...graph,
          nodes: graph.nodes.map((node) =>
            moves.has(node.id) ? { ...node, position: moves.get(node.id)! } : node,
          ),
        }
      : graph
    if (removed.size) next = removeNodes(next, removed)
    onGraphChange(next)
  }

  const handleEdgesChange = (changes: EdgeChange[]) => {
    if (!editable) return
    const selects = changes.filter((c) => c.type === 'select')
    if (selects.length) {
      setSelectedEdges((current) => {
        const next = new Set(current)
        for (const change of selects) {
          if (change.type !== 'select') continue
          if (change.selected) next.add(change.id)
          else next.delete(change.id)
        }
        return next
      })
    }
    const removed = new Set(changes.filter((c) => c.type === 'remove').map((c) => c.id))
    if (removed.size) {
      onGraphChange({
        ...graph,
        connections: graph.connections.filter((c) => !removed.has(connectionId(c))),
      })
    }
  }

  // No duplicates, and no cycles: the backend refuses both.
  const isValidConnection = (connection: Connection | Edge) => {
    const candidate = toConnection(connection as Connection)
    return (
      !graph.connections.some((c) => sameConnection(c, candidate)) &&
      !wouldCreateCycle(graph, candidate.from.nodeId, candidate.to.nodeId)
    )
  }

  const handleConnect = (connection: Connection) => {
    if (!editable || !isValidConnection(connection)) return
    onGraphChange({ ...graph, connections: [...graph.connections, toConnection(connection)] })
  }

  // Dropped on a node but not on a handle: connect to that node anyway,
  // its first input (or first output, when dragged from an input).
  const handleConnectEndOn = (
    base: WorkflowGraph,
    event: MouseEvent | TouchEvent,
    state: Parameters<OnConnectEnd>[1],
  ) => {
    if (!editable || state.isValid || !state.fromNode || !state.fromHandle) return
    const point = 'changedTouches' in event ? event.changedTouches[0] : event
    const element = document.elementFromPoint(point.clientX, point.clientY)
    const targetId = element?.closest('.react-flow__node')?.getAttribute('data-id')
    const target = nodes.find((node) => node.id === targetId)
    if (!target || target.id === state.fromNode.id) return

    const fromHandle = state.fromHandle.id ?? ''
    const connection =
      state.fromHandle.type === 'source'
        ? target.data.inputs > 0 &&
          { source: state.fromNode.id, sourceHandle: fromHandle, target: target.id, targetHandle: 'in-0' }
        : target.data.outputs.length > 0 &&
          { source: target.id, sourceHandle: 'out-0', target: state.fromNode.id, targetHandle: fromHandle }
    if (!connection) return
    const candidate = toConnection(connection)
    if (
      base.connections.some((c) => sameConnection(c, candidate)) ||
      wouldCreateCycle(base, candidate.from.nodeId, candidate.to.nodeId)
    ) {
      return
    }
    onGraphChange({ ...base, connections: [...base.connections, candidate] })
  }

  const handleConnectEnd: OnConnectEnd = (event, state) => handleConnectEndOn(graph, event, state)

  // Dragging an end of a connection: onto another handle moves it, onto a
  // node connects there, onto empty canvas removes it (as in n8n).
  const reconnected = useRef(false)

  const handleReconnect = (oldEdge: Edge, connection: Connection) => {
    reconnected.current = true
    const rest = { ...graph, connections: graph.connections.filter((c) => connectionId(c) !== oldEdge.id) }
    const candidate = toConnection(connection)
    const valid =
      !rest.connections.some((c) => sameConnection(c, candidate)) &&
      !wouldCreateCycle(rest, candidate.from.nodeId, candidate.to.nodeId)
    onGraphChange?.(valid ? { ...rest, connections: [...rest.connections, candidate] } : graph)
  }

  const handleReconnectEnd = (
    event: MouseEvent | TouchEvent,
    edge: Edge,
    _handleType: unknown,
    state: Parameters<OnConnectEnd>[1],
  ) => {
    if (reconnected.current) {
      reconnected.current = false
      return
    }
    const point = 'changedTouches' in event ? event.changedTouches[0] : event
    const overNode = document
      .elementFromPoint(point.clientX, point.clientY)
      ?.closest('.react-flow__node')
    if (!overNode) {
      removeConnection(edge.id)
      return
    }
    // Over a node but not a handle: treat it like dropping a new connection.
    const rest = { ...graph, connections: graph.connections.filter((c) => connectionId(c) !== edge.id) }
    onGraphChange?.(rest)
    handleConnectEndOn(rest, event, state)
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      colorMode={colorMode}
      fitView
      fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
      minZoom={0.2}
      maxZoom={2}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onConnect={handleConnect}
      onConnectEnd={handleConnectEnd}
      edgesReconnectable={editable}
      onReconnect={handleReconnect}
      onReconnectEnd={handleReconnectEnd}
      isValidConnection={isValidConnection}
      // Handles are small: snap to one within this distance.
      connectionRadius={30}
      // A click on a handle (or the "+" stub) must not start a click-to-connect mode.
      connectOnClick={false}
      nodesDraggable={editable}
      nodesConnectable={editable}
      edgesFocusable={editable}
      deleteKeyCode={editable ? ['Backspace', 'Delete'] : null}
      onNodeClick={(_, node) => onNodeClick?.(node.id)}
      onNodeDoubleClick={(_, node) => onNodeDoubleClick?.(node.id)}
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <Controls showInteractive={false} position="bottom-left" />
    </ReactFlow>
  )
}

export default WorkflowCanvas
