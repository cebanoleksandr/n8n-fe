import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import HistoryIcon from '@mui/icons-material/History'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router-dom'
import { useExecutions } from '../../hooks/api'

/** No run picked yet: open the newest, like n8n does. */
const WorkflowExecutionsIndex = () => {
  const { t } = useTranslation()
  const { workflowId } = useParams()
  const { data, isPending } = useExecutions({ workflowId, limit: 1 })

  if (isPending) {
    return (
      <div className="h-full flex items-center justify-center">
        <CircularProgress />
      </div>
    )
  }

  const newest = data?.items[0]
  if (newest) {
    return <Navigate to={`/workflows/${workflowId}/executions/${newest.id}`} replace />
  }

  return (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-center p-6">
      <HistoryIcon color="disabled" sx={{ fontSize: 48 }} />
      <Typography variant="h3">{t('executions.empty.title')}</Typography>
      <Typography color="text.secondary">{t('executions.workflowEmpty')}</Typography>
    </div>
  )
}

export default WorkflowExecutionsIndex
