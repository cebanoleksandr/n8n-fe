import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { type ExecutionStatus, isFinished } from '../../api/types'
import { canvasRunOf, lastStepByNode } from '../../components/executions/executionData'
import ExecutionLogs from '../../components/executions/ExecutionLogs'
import WorkflowCanvas from '../../components/workflow-canvas/WorkflowCanvas'
import {
  useCancelExecution,
  useExecution,
  pollWhileRunning,
  useExecutionEvents,
  useHasRole,
  useNodeTypes,
  useWorkflowVersion,
} from '../../hooks/api'
import { useExecutionStatusLine } from '../../hooks/useExecutionStatusLine'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { fonts } from '../../theme'
import { formatDateTime } from '../../utils/formatDate'

const STATUS_COLOR: Record<ExecutionStatus, string> = {
  queued: 'text.secondary',
  running: 'info.main',
  waiting: 'warning.main',
  success: 'success.main',
  error: 'error.main',
  canceled: 'text.secondary',
}

const Separator = () => (
  <Box component="span" sx={{ mx: 1, color: 'divider' }}>
    |
  </Box>
)

/** One run: its graph with node results, and the data each node handled. */
const ExecutionDetailsPage = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const canEdit = useHasRole('editor')
  const statusLine = useExecutionStatusLine()
  const { executionId } = useParams()

  const { data: execution, isPending, isError } = useExecution(executionId, pollWhileRunning)
  const finished = !!execution && isFinished(execution.status)
  // A run in progress updates live: statuses, then each node's output.
  useExecutionEvents(execution && !finished ? { executionId } : null)

  const version = useWorkflowVersion(execution?.workflowId, execution?.workflowVersionId)
  const nodeTypes = useNodeTypes()
  const cancel = useCancelExecution()

  // The picked log step; starts over for each run.
  const [selection, setSelection] = useState<{ executionId?: string; step: number | null }>({
    executionId,
    step: null,
  })
  const pickedStep = selection.executionId === executionId ? selection.step : null
  const selectStep = (step: number | null) => setSelection({ executionId, step })

  const steps = useMemo(() => execution?.steps ?? [], [execution])
  const lastSteps = useMemo(() => lastStepByNode(steps), [steps])

  // By default: the failed step, else the last one, as n8n opens them.
  const errorStep = steps.findIndex((step) => step.status === 'error')
  const selectedStep = pickedStep ?? (errorStep >= 0 ? errorStep : steps.length ? steps.length - 1 : null)

  const run = useMemo(() => canvasRunOf(steps), [steps])

  const handleCancel = () => {
    if (!execution) return
    cancel.mutate(execution.id, {
      onSuccess: () => dispatch(setAlertAC({ text: 'executions.canceledAlert', mode: 'success' })),
      onError: () => dispatch(setAlertAC({ text: 'executions.cancelFailed', mode: 'error' })),
    })
  }

  if (isPending) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircularProgress />
      </div>
    )
  }

  if (isError || !execution) {
    return (
      <div className="p-6">
        <Alert severity="error">{t('executions.notFoundOne')}</Alert>
      </div>
    )
  }

  // A failure outside any node (e.g. the queue), so the logs can't show it.
  const runError = execution.error && !steps.some((step) => step.error) ? execution.error : null

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0 flex items-start justify-between gap-4 px-6 py-4">
        <div className="min-w-0">
          <Typography variant="h3">
            {formatDateTime(execution.startedAt ?? execution.createdAt, i18n.language)}
          </Typography>
          <Typography variant="body2" color="text.secondary" component="div" noWrap>
            <Box component="span" sx={{ color: STATUS_COLOR[execution.status], fontWeight: 600 }}>
              {statusLine(execution)}
            </Box>
            <Separator />
            <Tooltip title={execution.id}>
              <Box component="span" sx={{ fontFamily: fonts.mono }}>
                ID {execution.id.slice(0, 8)}
              </Box>
            </Tooltip>
            {version.data && (
              <>
                <Separator />
                {t('executions.version', { version: version.data.version })}
              </>
            )}
            <Separator />
            {t(`executions.mode.${execution.mode}`)}
          </Typography>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canEdit && !finished && (
            <Button
              color="error"
              variant="outlined"
              startIcon={<StopCircleOutlinedIcon />}
              onClick={handleCancel}
              loading={cancel.isPending}
            >
              {t('executions.actions.cancel')}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            onClick={() => navigate(`/workflows/${execution.workflowId}`)}
          >
            {t('executions.actions.openEditor')}
          </Button>
        </div>
      </div>

      {runError && (
        <Alert severity="error" className="mx-6 mb-3">
          {runError.message}
        </Alert>
      )}

      <div className="flex-1 min-h-0">
        {version.data ? (
          <WorkflowCanvas
            // Re-fit when another run uses a different version of the graph.
            key={version.data.id}
            graph={version.data.graph}
            nodeTypeDescriptions={nodeTypes.data}
            run={run}
            selectedNodeId={selectedStep !== null ? steps[selectedStep]?.nodeId : null}
            onNodeClick={(nodeId) => selectStep(lastSteps.get(nodeId) ?? null)}
          />
        ) : version.isError ? (
          <Alert severity="error" className="mx-6">
            {t('executions.graphFailed')}
          </Alert>
        ) : (
          <div className="h-full flex items-center justify-center">
            <CircularProgress />
          </div>
        )}
      </div>

      <Box className="shrink-0 h-[40%] min-h-56" sx={{ borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        {version.data && (
          <ExecutionLogs
            execution={execution}
            graph={version.data.graph}
            nodeTypeDescriptions={nodeTypes.data}
            selectedStep={selectedStep}
            onSelectStep={selectStep}
          />
        )}
      </Box>
    </div>
  )
}

export default ExecutionDetailsPage
