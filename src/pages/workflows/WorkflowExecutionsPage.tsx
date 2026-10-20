import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, Outlet, useParams } from 'react-router-dom'
import ExecutionsSidebar from '../../components/executions/ExecutionsSidebar'
import { useIsMobile } from '../../hooks/useIsMobile'

/** The workflow's "Executions" tab: its runs on the left, the open one on the right. */
const WorkflowExecutionsPage = () => {
  const { t } = useTranslation()
  const { workflowId, executionId } = useParams()
  const isMobile = useIsMobile()

  // Phones: the list or one run, each on the whole screen. Without a run the
  // list is shown, so the index (which opens the newest run) isn't rendered.
  if (isMobile) {
    if (!executionId) return <ExecutionsSidebar workflowId={workflowId!} />
    return (
      <div className="h-full flex flex-col min-h-0">
        <Box className="shrink-0 px-2 py-1" sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Button
            size="small"
            startIcon={<ArrowBackIcon />}
            component={RouterLink}
            to={`/workflows/${workflowId}/executions`}
          >
            {t('executions.backToList')}
          </Button>
        </Box>
        <div className="flex-1 min-h-0">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex min-h-0">
      <ExecutionsSidebar workflowId={workflowId!} />
      <div className="flex-1 min-w-0 min-h-0">
        <Outlet />
      </div>
    </div>
  )
}

export default WorkflowExecutionsPage
