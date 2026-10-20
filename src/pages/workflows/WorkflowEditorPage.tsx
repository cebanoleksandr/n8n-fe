import { lazy, Suspense, useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HistoryIcon from '@mui/icons-material/History'
import RedoIcon from '@mui/icons-material/Redo'
import UndoIcon from '@mui/icons-material/Undo'
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
  type ClipboardNodes,
  copyNodes,
  createNode,
  nextFreePosition,
  NODE_SPACING_X,
  outputNamesOf,
  parseClipboard,
  pasteNodes,
  removeNodes,
  renameNode,
} from '../../components/workflow-canvas/graph'
import {
  emptyHistory,
  type GraphHistory,
  recordEdit,
  redo,
  undo,
} from '../../components/workflow-editor/graphHistory'
import WorkflowCanvas from '../../components/workflow-canvas/WorkflowCanvas'
import NodePicker from '../../components/workflow-editor/NodePicker'
import { useEditorRun } from '../../components/workflow-editor/useEditorRun'
import { useTestWebhook } from '../../components/workflow-editor/useTestWebhook'
import VersionsPanel from '../../components/workflow-editor/VersionsPanel'
import {
  useHasRole,
  useNodeTypes,
  useRestoreWorkflowVersion,
  useUpdateWorkflow,
  useWorkflow,
  useWorkflowVersion,
} from '../../hooks/api'
import { useIsMobile, useIsTouch } from '../../hooks/useIsMobile'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { formatDateTime } from '../../utils/formatDate'
import { workflowsService } from '../../services/workflows.service'

const AUTOSAVE_DELAY_MS = 2000

// Opened on double-click only; it brings CodeMirror, so it loads then.
const NodeDetailsPopup = lazy(() => import('../../components/node-details/NodeDetailsPopup'))

interface Draft {
  workflowId: string
  graph: WorkflowGraph
  /** The graph as last saved: unsaved changes are anything else. */
  saved: WorkflowGraph
  /** Undo / redo of edits to `graph`. */
  history: GraphHistory
}

/** Where the picker adds a node: after an output, or anywhere. */
type PickerTarget = { source?: ConnectionEndpoint }

const WorkflowEditorPage = () => {
  const { t, i18n } = useTranslation()
  const { workflowId } = useParams() as { workflowId: string }
  const canEdit = useHasRole('editor')
  const isMobile = useIsMobile()
  const isTouch = useIsTouch()
  // Toolbar buttons: smaller on phones, so they fit next to each other.
  const toolSize = isMobile ? 'small' : 'medium'

  const workflow = useWorkflow(workflowId)
  const nodeTypes = useNodeTypes()
  const update = useUpdateWorkflow()
  const editorRun = useEditorRun(workflowId)

  // The graph being edited. Taken from the server once per workflow, so a
  // refetch (e.g. after toggling "active") never wipes unsaved changes.
  const [draft, setDraft] = useState<Draft | null>(null)
  if (workflow.data && draft?.workflowId !== workflowId) {
    setDraft({ workflowId, graph: workflow.data.graph, saved: workflow.data.graph, history: emptyHistory() })
  }
  const graph = draft?.workflowId === workflowId ? draft.graph : undefined
  const isDirty = !!draft && draft.graph !== draft.saved

  const [picker, setPicker] = useState<PickerTarget | null>(null)
  const [pickerDismissed, setPickerDismissed] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // The last graph the server refused: autosave waits for the next change.
  const [failedGraph, setFailedGraph] = useState<WorkflowGraph | null>(null)
  const [logsOpen, setLogsOpen] = useState(false)
  const [selectedStep, setSelectedStep] = useState<number | null>(null)
  // The node whose settings are open (double-click on the canvas).
  const [openNodeId, setOpenNodeId] = useState<string | null>(null)
  // Version history: the panel, and an older version shown read-only.
  const [historyOpen, setHistoryOpen] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const preview = useWorkflowVersion(workflowId, previewId ?? undefined)
  const restore = useRestoreWorkflowVersion()
  // Pinned data saves on its own, apart from the graph's autosave.
  const pinUpdate = useUpdateWorkflow()
  const dispatch = useAppDispatch()

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
  const showPicker = canEdit && !historyOpen && (picker !== null || (isEmpty && !pickerDismissed))
  const previewing = previewId !== null

  // Every edit is recorded for undo; a drag or typing in a field is one step.
  const setGraph = useCallback(
    (next: WorkflowGraph, change?: { continuous: boolean }) =>
      setDraft(
        (current) =>
          current &&
          (current.graph === next
            ? current
            : {
                ...current,
                graph: next,
                history: recordEdit(current.history, current.graph, Date.now(), change?.continuous),
              }),
      ),
    [],
  )

  const step = (direction: 'undo' | 'redo') =>
    setDraft((current) => {
      if (!current) return current
      const result = (direction === 'undo' ? undo : redo)(current.history, current.graph)
      return result ? { ...current, graph: result.graph, history: result.history } : current
    })
  const canUndo = !!draft?.history.past.length
  const canRedo = !!draft?.history.future.length

  // Selected nodes, for copy, cut, duplicate and select all.
  const [selection, setSelection] = useState(new Set<string>())

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
      setFailedGraph(null)
      return true
    } catch (error) {
      // Shown on the canvas: graph issues can be long, and alerts translate keys.
      setSaveError(getErrorMessage(error))
      setFailedGraph(sent)
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
    // Typing in a field: one undo step per pause, not per key.
    setGraph({ ...graph, nodes: graph.nodes.map((n) => (n.id === node.id ? node : n)) }, { continuous: true })
  }

  const openHistory = () => {
    setPicker(null)
    setPickerDismissed(true)
    setHistoryOpen(true)
  }

  const closeHistory = () => {
    setHistoryOpen(false)
    setPreviewId(null)
  }

  const pinData = workflow.data?.pinData
  const pinnedNodeIds = useMemo(() => new Set(Object.keys(pinData ?? {})), [pinData])

  /** Pins (or unpins, with null) a node's output for test runs. */
  const setPinned = async (nodeId: string, items: Record<string, unknown>[] | null): Promise<boolean> => {
    // Pins of deleted nodes go too.
    const nodeIds = new Set(graph?.nodes.map((node) => node.id))
    const next = Object.fromEntries(
      Object.entries(pinData ?? {}).filter(([id]) => id !== nodeId && nodeIds.has(id)),
    )
    if (items) next[nodeId] = items
    try {
      await pinUpdate.mutateAsync({ id: workflowId, input: { pinData: next } })
      dispatch(setAlertAC({ text: items ? 'nodeDetails.pin.pinned' : 'nodeDetails.pin.unpinned', mode: 'success' }))
      return true
    } catch (error) {
      dispatch(setAlertAC({ text: apiErrorMessage(error, t), mode: 'error' }))
      return false
    }
  }

  /** Makes the previewed version current again, as a new version. */
  const restorePreview = async () => {
    if (!preview.data) return
    // Unsaved changes are saved first: they stay in the history.
    if (!(await save())) return
    try {
      const restored = await restore.mutateAsync({ id: workflowId, versionId: preview.data.id })
      setDraft({ workflowId, graph: restored.graph, saved: restored.graph, history: emptyHistory() })
      setPreviewId(null)
      dispatch(
        setAlertAC({
          text: t('editor.versions.restored', { from: preview.data.version, to: restored.version }),
          mode: 'success',
        }),
      )
    } catch (error) {
      setSaveError(getErrorMessage(error))
    }
  }

  /**
   * Canvas shortcuts apply when no field has focus (fields have their own
   * undo and copy) and no popup is open, as in any editor.
   */
  const canvasHasFocus = (target: EventTarget | null) =>
    !previewing &&
    !document.querySelector('[role=dialog]') &&
    !(
      target instanceof HTMLElement &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
    )

  const selectedIds = () => new Set(graph?.nodes.filter((node) => selection.has(node.id)).map((node) => node.id))

  const paste = (data: ClipboardNodes) => {
    if (!graph) return
    const result = pasteNodes(graph, data)
    setGraph(result.graph)
    setSelection(new Set(result.ids))
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const mod = event.ctrlKey || event.metaKey
    if (!mod) return
    const key = event.key.toLowerCase()
    // Ctrl/Cmd+S saves, wherever the focus is.
    if (key === 's') {
      event.preventDefault()
      if (canEdit) void save()
      return
    }
    if (!canEdit || !graph || !canvasHasFocus(event.target)) return
    if (key === 'z' || key === 'y') {
      event.preventDefault()
      step(key === 'y' || event.shiftKey ? 'redo' : 'undo')
    } else if (key === 'a') {
      event.preventDefault()
      setSelection(new Set(graph.nodes.map((node) => node.id)))
    } else if (key === 'd') {
      event.preventDefault()
      const ids = selectedIds()
      if (ids.size) paste(copyNodes(graph, ids))
    }
  })

  // Copy, cut and paste through the clipboard events: no permission prompt,
  // and the nodes travel between workflows and tabs as JSON text.
  const onClipboard = useEffectEvent((event: ClipboardEvent) => {
    if (!graph || !canvasHasFocus(event.target)) return
    if (event.type === 'paste') {
      const data = canEdit ? parseClipboard(event.clipboardData?.getData('text/plain') ?? '') : null
      if (!data) return
      event.preventDefault()
      paste(data)
      return
    }
    // Copying text the user selected on the page stays a text copy.
    if (window.getSelection()?.toString()) return
    const ids = selectedIds()
    if (!ids.size) return
    event.preventDefault()
    event.clipboardData?.setData('text/plain', JSON.stringify(copyNodes(graph, ids)))
    if (event.type === 'cut' && canEdit) {
      setGraph(removeNodes(graph, ids))
      setSelection(new Set())
    }
  })
  useEffect(() => {
    const listener = (event: ClipboardEvent) => onClipboard(event)
    for (const type of ['copy', 'cut', 'paste'] as const) document.addEventListener(type, listener)
    return () => {
      for (const type of ['copy', 'cut', 'paste'] as const) document.removeEventListener(type, listener)
    }
  }, [])

  useEffect(() => {
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  // Autosave: a moment after the last change, like a document editor.
  // A graph the server refused is not retried until it changes again.
  const autosave = useEffectEvent(() => void save())
  const pendingGraph = draft?.graph
  useEffect(() => {
    if (!canEdit || !isDirty || update.isPending || pendingGraph === failedGraph) return
    const timer = setTimeout(autosave, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [canEdit, isDirty, update.isPending, pendingGraph, failedGraph])

  // Closing or reloading the tab within that moment: send the last changes
  // with a request that outlives the page. Only a graph the server already
  // refused makes the browser ask, since sending it again would fail too.
  useEffect(() => {
    if (!canEdit || !isDirty || !pendingGraph) return
    const refused = pendingGraph === failedGraph
    const onPageHide = () => {
      if (!refused) workflowsService.saveGraphOnUnload(workflowId, pendingGraph)
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (refused) event.preventDefault()
    }
    window.addEventListener('pagehide', onPageHide)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [canEdit, isDirty, pendingGraph, failedGraph, workflowId])

  // Leaving within the app: save first, and ask only if that fails.
  const blocker = useBlocker(canEdit && isDirty)
  const onBlocked = useEffectEvent(async () => {
    if (await save()) blocker.proceed?.()
  })
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    // Saving updates state: run it as a callback, not during the effect.
    const timer = setTimeout(() => void onBlocked(), 0)
    return () => clearTimeout(timer)
  }, [blocker.state])
  const saveRefused = !!failedGraph && failedGraph === pendingGraph

  const execution = editorRun.execution
  const run = useMemo(
    () => (execution ? canvasRunOf(execution.steps, editorRun.runningNodeId) : undefined),
    [execution, editorRun.runningNodeId],
  )

  const selectedNodes = graph?.nodes.filter((node) => selection.has(node.id)) ?? []

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
      <div className="p-4 sm:p-6">
        <Alert severity="error">{t('editor.loadFailed')}</Alert>
      </div>
    )
  }

  return (
    <div className="relative h-full flex min-h-0">
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="relative flex-1 min-h-0">
          {previewing ? (
            preview.data ? (
              <WorkflowCanvas
                // Fits the view to each version shown.
                key={preview.data.id}
                graph={preview.data.graph}
                nodeTypeDescriptions={nodeTypes.data}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <CircularProgress />
              </div>
            )
          ) : (
            <WorkflowCanvas
              key="draft"
              graph={graph}
              nodeTypeDescriptions={nodeTypes.data}
              run={run}
              pinnedNodeIds={pinnedNodeIds}
              selection={selection}
              onSelectionChange={setSelection}
              onGraphChange={canEdit ? setGraph : undefined}
              onAddFrom={canEdit ? (source) => setPicker({ source }) : undefined}
              onNodeDoubleClick={setOpenNodeId}
              onNodeClick={(nodeId) => {
                const index = execution?.steps.findLastIndex((step) => step.nodeId === nodeId) ?? -1
                if (index >= 0) setSelectedStep(index)
              }}
            />
          )}

          {previewing && preview.data && (
            <Alert
              severity="info"
              icon={<HistoryIcon />}
              className="absolute top-3 left-1/2 -translate-x-1/2 items-center"
              // As wide as its content, so the buttons stay on one line.
              // Phones: full width, the buttons go under the text.
              sx={{
                width: { xs: 'calc(100% - 24px)', sm: 'max-content' },
                maxWidth: 'calc(100% - 24px)',
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                '& .MuiAlert-action': { ml: { xs: 0, sm: 'auto' } },
                '& .MuiButton-root': { whiteSpace: 'nowrap' },
              }}
              action={
                <div className="flex gap-1">
                  {canEdit && (
                    <Button size="small" variant="contained" onClick={() => void restorePreview()} loading={restore.isPending}>
                      {t('editor.versions.restore')}
                    </Button>
                  )}
                  <Button size="small" color="inherit" onClick={() => setPreviewId(null)}>
                    {t('editor.versions.backToEditing')}
                  </Button>
                </div>
              }
            >
              {t('editor.versions.viewing', {
                version: preview.data.version,
                when: formatDateTime(preview.data.createdAt, i18n.language),
              })}
            </Alert>
          )}

          {isEmpty && canEdit && !previewing && (
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

          <div className="absolute top-3 right-3 flex items-start gap-2">
            {canEdit && !previewing && (
              /* Saves by itself; a click (or Ctrl+S) saves right away. */
              <Button
                variant="outlined"
                size={toolSize}
                color={saveRefused ? 'error' : 'inherit'}
                disabled={!isDirty || update.isPending}
                onClick={() => void save()}
                sx={{ bgcolor: 'background.paper' }}
              >
                {t(
                  update.isPending
                    ? 'editor.saving'
                    : saveRefused
                      ? 'editor.saveFailed'
                      : isDirty
                        ? 'editor.save'
                        : 'editor.saved',
                )}
              </Button>
            )}
            {canEdit && !previewing && (
              <div className="flex">
                <Tooltip title={t('editor.undo')}>
                  <span>
                    <IconButton
                      size={toolSize}
                      onClick={() => step('undo')}
                      disabled={!canUndo}
                      aria-label={t('editor.undo')}
                      sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: '8px 0 0 8px' }}
                    >
                      <UndoIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={t('editor.redo')}>
                  <span>
                    <IconButton
                      size={toolSize}
                      onClick={() => step('redo')}
                      disabled={!canRedo}
                      aria-label={t('editor.redo')}
                      sx={{ bgcolor: 'background.paper', border: 1, borderLeft: 0, borderColor: 'divider', borderRadius: '0 8px 8px 0' }}
                    >
                      <RedoIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </div>
            )}
            {!historyOpen && (
              <Tooltip title={t('editor.versions.title')} placement="bottom">
                <IconButton
                  size={toolSize}
                  onClick={openHistory}
                  aria-label={t('editor.versions.title')}
                  sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
                >
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
            )}
            {canEdit && !previewing && !showPicker && (
              <Tooltip title={t('editor.addNode')} placement="left">
                <IconButton
                  size={toolSize}
                  onClick={() => {
                    setHistoryOpen(false)
                    setPicker({})
                  }}
                  aria-label={t('editor.addNode')}
                  sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            )}
          </div>

          {saveError && (
            <Alert
              severity="error"
              onClose={() => setSaveError(null)}
              // Phones: under the toolbar, across the canvas.
              className="absolute top-14 inset-x-3 sm:top-3 sm:right-auto sm:max-w-lg whitespace-pre-line"
            >
              {saveError}
            </Alert>
          )}

          {/* Touch screens: what double-click and the Delete key do with a mouse. */}
          {isTouch && canEdit && !previewing && selectedNodes.length > 0 && (
            <Box
              // Above the run button.
              className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-lg shadow-md"
              sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}
            >
              {selectedNodes.length === 1 && (
                <Button size="small" startIcon={<EditOutlinedIcon />} onClick={() => setOpenNodeId(selectedNodes[0].id)}>
                  {t('editor.selection.open')}
                </Button>
              )}
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutlineIcon />}
                onClick={() => {
                  setGraph(removeNodes(graph, new Set(selectedNodes.map((node) => node.id))))
                  setSelection(new Set())
                }}
              >
                {t('editor.selection.delete')}
              </Button>
            </Box>
          )}

          {canEdit && hasTrigger && !previewing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <Button
                variant="contained"
                size={isMobile ? 'medium' : 'large'}
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
            height: logsOpen ? (isMobile ? '60%' : '40%') : 'auto',
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

      {historyOpen && (
        <VersionsPanel
          workflowId={workflowId}
          currentVersion={workflow.data?.version}
          previewId={previewId}
          onPreview={setPreviewId}
          onClose={closeHistory}
        />
      )}

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
            pinned={pinData?.[openNode.id]}
            onSetPinned={(items) => setPinned(openNode.id, items)}
            isSavingPin={pinUpdate.isPending}
            onClose={() => setOpenNodeId(null)}
          />
        </Suspense>
      )}

      <ConfirmPopup
        // Only when saving on the way out failed.
        isVisible={blocker.state === 'blocked' && saveRefused && !update.isPending}
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
