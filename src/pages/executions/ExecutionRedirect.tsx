import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import { useTranslation } from 'react-i18next'
import { Navigate, useParams } from 'react-router-dom'
import { useExecution } from '../../hooks/api'

/** /executions/:id opens the run inside its workflow's executions tab. */
const ExecutionRedirect = () => {
  const { t } = useTranslation()
  const { executionId } = useParams()
  const { data, isError } = useExecution(executionId)

  if (data) {
    return <Navigate to={`/workflows/${data.workflowId}/executions/${data.id}`} replace />
  }
  if (isError) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-4 sm:px-6 sm:py-6">
        <Alert severity="error">{t('executions.notFoundOne')}</Alert>
      </div>
    )
  }
  return (
    <div className="h-full flex items-center justify-center py-16">
      <CircularProgress />
    </div>
  )
}

export default ExecutionRedirect
