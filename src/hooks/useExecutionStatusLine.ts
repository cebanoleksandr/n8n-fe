import { useTranslation } from 'react-i18next'
import { type ExecutionSummary, isFinished } from '../api/types'
import { formatDuration } from '../utils/formatDate'

/** "Succeeded in 75ms", or just the status while the run has no end yet. */
export function useExecutionStatusLine() {
  const { t } = useTranslation()
  return (execution: ExecutionSummary) =>
    isFinished(execution.status) && execution.startedAt && execution.finishedAt
      ? t(`executions.statusIn.${execution.status}`, {
          duration: formatDuration(
            Date.parse(execution.finishedAt) - Date.parse(execution.startedAt),
          ),
        })
      : t(`executions.status.${execution.status}`)
}
