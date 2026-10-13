import type { FC, ReactNode } from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import BlockIcon from '@mui/icons-material/Block'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ScheduleIcon from '@mui/icons-material/Schedule'
import { useTranslation } from 'react-i18next'
import type { ExecutionStatus } from '../../api/types'

const ICONS: Record<ExecutionStatus, ReactNode> = {
  queued: <ScheduleIcon fontSize="small" color="disabled" />,
  running: <CircularProgress size={16} color="info" />,
  waiting: <HourglassEmptyIcon fontSize="small" color="warning" />,
  success: <CheckCircleIcon fontSize="small" color="success" />,
  error: <CancelIcon fontSize="small" color="error" />,
  canceled: <BlockIcon fontSize="small" color="disabled" />,
}

/** Icon and name of an execution status, as in n8n's executions list. */
const ExecutionStatusBadge: FC<{ status: ExecutionStatus }> = ({ status }) => {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-flex w-5 justify-center">{ICONS[status]}</span>
      <Typography variant="body2" component="span">
        {t(`executions.status.${status}`)}
      </Typography>
    </span>
  )
}

export default ExecutionStatusBadge
