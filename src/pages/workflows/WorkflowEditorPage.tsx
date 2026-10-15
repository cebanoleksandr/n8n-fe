import { lazy, Suspense, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { useTranslation } from 'react-i18next'
import { useBlocker, useParams } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import type {
  ConnectionEndpoint,
  NodeTypeDescription,
  RunWorkflowInput,
  WorkflowGraph,
  WorkflowNode,
} from '../../api/types'
import ExecutionLogs from '../../components/executions/ExecutionLogs'
import { canvasRunOf } from '../../components/executions/executionData'
import ConfirmPopup from '../../components/popups/ConfirmPopup'
import {
  createNode,
  NODE_SPACING_X,
  nextFreePosition,
  outputNamesOf,
  renameNode,
} from '../../components/workflow-canvas/graph'
import WorkflowCanvas from '../../components/workflow-canvas/WorkflowCanvas'
import NodePicker from '../../components/workflow-editor/NodePicker'
import { useEditorRun } from '../../components/workflow-editor/useEditorRun'
import { useTestWebhook } from '../../components/workflow-editor/useTestWebhook'
import { useHasRole, useNodeTypes, useUpdateWorkflow, useWorkflow } from '../../hooks/api'

// Opened on double-click only; it brings CodeMirror, so it loads then.
const NodeDetailsPopup = lazy(() => import('../../components/node-details/NodeDetailsPopup'))

interface Draft {
  workflowId: string
  graph: WorkflowGraph
  /** The graph as last saved: unsaved changes are anything else. */
  saved: WorkflowGraph
}

/** Where the picker adds a node: after an output, or anywhere. */
type PickerTarget = { source?: ConnectionEndpoint }

const WorkflowEditorPage = () => {
  const { t } = useTranslation()
  const { workflowId } = useParams() as { workflowId: string }
  const canEdit = useHasRole('editor')

  const workflow = useWorkflow(workflowId)
  const nodeTypes = useNodeTypes()
  const update = useUpdateWorkflow()
  const editorRun = useEditorRun(workflowId)

  // The graph being edited. Taken from the server once per workflow, so a
  // refetch (e.g. after toggling "active") never wipes unsaved changes.
  const [draft, setDraft] = useState<Draft | null>(null)
  if (workflow.data && draft?.workflowId !== workflowId) {
    setDraft({ workflowId, graph: workflow.data.graph, saved: workflow.data.graph })
  }
  const graph = draft?.workflowId === workflowId ? draft.graph : undefined
  const isDirty = !!draft && draft.graph !== draft.saved

  const [picker, setPicker] = useState<PickerTarget | null>(null)
  const [pickerDismissed, setPickerDismissed] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  // The node whose settings are open (double-click on the canvas).
  const [openNodeId, setOpenNodeId] = useState<string | null>(null)

  // A request on the test URL starts a run: show it like any other.
  const testWebhook = useTestWebhook(workflowId, (executionId) => {
    editorRun.follow(executionId)
    setSelectedStep(null)
    setLogsOpen(true)
  })

  const descriptions = useMemo(
    () => new Map(nodeTypes.data?.map((d) => [d.type, d])),
    [nodeTypes.data],
  )
  const triggers =
    graph?.nodes.filter((node) => !node.disabled && descriptions.get(node.type)?.group === 'trigger') ?? []
  const hasTrigger = triggers.length > 0
  // Only webhooks start it: "execute" means waiting for a test request.
  const webhookOnly = hasTrigger && triggers.every((node) => node.type === 'core.webhook')
  const isEmpty = !!graph && graph.nodes.length === 0
  // An empty workflow opens with the trigger list, like n8n.
  const showPicker = canEdit && (picker !== null || (isEmpty && !pickerDismissed))

  const setGraph = useCallback(
    (next: WorkflowGraph) => setDraft((current) => current && { ...current, graph: next }),
    [],
  )

  const closePicker = () => {
    setPicker(null)
    setPickerDismissed(true)
  }

  const addNode = (description: NodeTypeDescription) => {
    if (!graph) return
    const source = picker?.source
    const sourceNode = source && graph.nodes.find((node) => node.id === source.nodeId)
    let position = nextFreePosition(graph)
    if (sourceNode) {
      // Fan the outputs of If/Switch out vertically.
      const outputs = outputNamesOf(sourceNode, descriptions.get(sourceNode.type)).length
      const offset = (source.index - (outputs - 1) / 2) * 140
      position = [sourceNode.position[0] + NODE_SPACING_X, sourceNode.position[1] + offset]
    }
    const node = createNode(description, position, graph.nodes)
    setGraph({
      nodes: [...graph.nodes, node],
      connections:
        source && description.inputs > 0
          ? [...graph.connections, { from: source, to: { nodeId: node.id, index: 0 } }]
          : graph.connections,
    })
    closePicker()
  }

  const save = async (): Promise<boolean> => {
    if (!draft || !isDirty) return true
    const sent = draft.graph
    try {
      await update.mutateAsync({ id: workflowId, input: { graph: sent } })
      // Edits made while saving stay unsaved.
      setDraft((current) => current && { ...current, saved: sent })
      setSaveError(null)
      return true
    } catch (error) {
      // Shown on the canvas: graph issues can be long, and alerts translate keys.
      setSaveError(getErrorMessage(error))
      return false
    }
  }

  const execute = async (input?: RunWorkflowInput) => {
    if (!(await save())) return
    try {
      await editorRun.run(input)
      setSelectedStep(null)
      setLogsOpen(true)
    } catch (error) {
      setSaveError(getErrorMessage(error))
    }
  }

  /** Listens on the test URL of one Webhook node, or of all of them. */
  const listenFor = async (nodeId?: string) => {
    if (!(await save())) return
    try {
      await testWebhook.start(nodeId)
    } catch (error) {
      setSaveError(getErrorMessage(error))
    }
  }

  const updateNode = (node: WorkflowNode) => {
    if (!graph) return
    setGraph({ ...graph, nodes: graph.nodes.map((n) => (n.id === node.id ? node : n)) })
  }

  // Ctrl/Cmd+S saves, like any editor.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault()
      if (canEdit) void save()
    }
  })
  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  // Closing the tab with unsaved changes asks the browser's own question.
  useEffect(() => {
    if (!isDirty) return
    const listener = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', listener)
    return () => window.removeEventListener('beforeunload', listener)
  }, [isDirty])

  // Leaving within the app asks ours.
  const blocker = useBlocker(isDirty)

  const execution = editorRun.execution
  const run = useMemo(
    () => (execution ? canvasRunOf(execution.steps, editorRun.runningNodeId) : undefined),
    [execution, editorRun.runningNodeId],
  )

  // Gone when the node is deleted while its settings are open.
  const openNode = graph?.nodes.find((node) => node.id === openNodeId)

  if (workflow.isPending || nodeTypes.isPending) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircularProgress />
      </div>
    )
  }

  if (workflow.isError || !graph) {
    return (
      <div className="p-6">
        <Alert severity="error">{t('editor.loadFailed')}</Alert>
      </div>
    )
  }

  return (
    <div className="h-full flex min-h-0">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="relative flex-1 min-h-0">
          <WorkflowCanvas
            graph={graph}
            nodeTypeDescriptions={nodeTypes.data}
            run={run}
            onGraphChange={canEdit ? setGraph : undefined}
            onAddFrom={canEdit ? (source) => setPicker({ source }) : undefined}
            onNodeDoubleClick={setOpenNodeId}
            onNodeClick={(nodeId) => {
              const index = execution?.steps.findLastIndex((step) => step.nodeId === nodeId) ?? -1
              if (index >= 0) setSelectedStep(index)
            }}
          />

          {isEmpty && canEdit && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                type="button"
                onClick={() => setPicker({})}
                className="pointer-events-auto flex flex-col items-center gap-3 cursor-pointer bg-transparent border-0"
              >
                <Box
                  className="flex items-center justify-center"
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 2,
                    border: '2px dashed',
                    borderColor: 'text.secondary',
                    color: 'text.secondary',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                  }}
                >
                  <AddIcon sx={{ fontSize: 40 }} />
                </Box>
                <Typography sx={{ fontWeight: 600 }}>{t('editor.addFirstStep')}</Typography>
              </button>
            </div>
          )}

          {canEdit && (
            <div className="absolute top-3 right-3 flex items-start gap-2">
              <Button
                variant={isDirty ? 'contained' : 'outlined'}
                disabled={!isDirty}
                onClick={() => void save()}
                loading={update.isPending}
              >
                {t(isDirty ? 'editor.save' : 'editor.saved')}
              </Button>
              {!showPicker && (
                <Tooltip title={t('editor.addNode')} placement="left">
                  <IconButton
                    onClick={() => setPicker({})}
                    sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
                  >
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              )}
            </div>
          )}

          {saveError && (
            <Alert
              severity="error"
              onClose={() => setSaveError(null)}
              className="absolute top-3 left-3 max-w-lg whitespace-pre-line"
            >
              {saveError}
            </Alert>
          )}

          {canEdit && hasTrigger && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Button
                variant="contained"
                size="large"
                startIcon={<PlayArrowIcon />}
                onClick={() =>
                  testWebhook.until
                    ? testWebhook.cancel()
                    : void (webhookOnly ? listenFor() : execute())
                }
                loading={
                  editorRun.isStarting || editorRun.isRunning || testWebhook.isStarting
                }
                loadingPosition="start"
                color={testWebhook.until ? 'inherit' : 'primary'}
              >
                {t(
                  testWebhook.until
                    ? 'editor.run.stopListening'
                    : editorRun.isRunning
                      ? 'editor.run.running'
                      : webhookOnly
                        ? 'editor.run.listen'
                        : 'editor.run.execute',
                )}
              </Button>
            </div>
          )}
        </div>

        <Box
          className="shrink-0 flex flex-col min-h-0"
          sx={{
            height: logsOpen ? '40%' : 'auto',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <button
            type="button"
            onClick={() => setLogsOpen((open) => !open)}
            className="flex items-center justify-between px-4 py-1.5 bg-transparent border-0 cursor-pointer text-left"
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t('editor.logs')}
            </Typography>
            {logsOpen ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
          </button>
          {logsOpen && (
            <Box className="flex-1 min-h-0" sx={{ borderTop: 1, borderColor: 'divider' }}>
              {execution ? (
                <ExecutionLogs
                  execution={execution}
                  graph={graph}
                  nodeTypeDescriptions={nodeTypes.data}
                  selectedStep={selectedStep ?? (execution.steps.length ? execution.steps.length - 1 : null)}
                  onSelectStep={setSelectedStep}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Typography color="text.secondary">{t('editor.noRunYet')}</Typography>
                </div>
              )}
            </Box>
          )}
        </Box>
      </div>

      {showPicker && nodeTypes.data && (
        <NodePicker
          nodeTypes={nodeTypes.data}
          triggersOnly={!hasTrigger}
          onPick={addNode}
          onClose={closePicker}
        />
      )}

      {openNode && (
        <Suspense fallback={null}>
          <NodeDetailsPopup
            // A fresh panel (tabs, name field) for each node.
            key={openNode.id}
            node={openNode}
            description={descriptions.get(openNode.type)}
            graph={graph}
            execution={execution}
            isRunning={editorRun.isStarting || editorRun.isRunning}
            canEdit={canEdit}
            onChange={updateNode}
            onRename={(name) => setGraph(renameNode(graph, openNode.id, name))}
            onTest={() =>
              void (openNode.type === 'core.webhook'
                ? listenFor(openNode.id)
                : execute({ destinationNodeId: openNode.id }))
            }
            testWebhook={{
              until: testWebhook.until,
              isStarting: testWebhook.isStarting,
              onListen: () => void listenFor(openNode.id),
              onStop: testWebhook.cancel,
            }}
            onClose={() => setOpenNodeId(null)}
          />
        </Suspense>
      )}

      <ConfirmPopup
        isVisible={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        onConfirm={() => blocker.proceed?.()}
        title={t('editor.unsaved.title')}
        text={t('editor.unsaved.text')}
        confirmLabel={t('editor.unsaved.leave')}
        danger
      />
    </div>
  )
}

export default WorkflowEditorPage
