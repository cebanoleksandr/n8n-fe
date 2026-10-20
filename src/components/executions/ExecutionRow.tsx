import { useState, type FC, type MouseEvent } from 'react'
import { alpha } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TableCell from '@mui/material/TableCell'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { type ExecutionSummary, isFinished } from '../../api/types'
import { useCancelExecution } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { fonts } from '../../theme'
import { formatDateTime, formatDuration } from '../../utils/formatDate'
import ExecutionStatusBadge from './ExecutionStatusBadge'

interface IProps {
  execution: ExecutionSummary
  canEdit: boolean
  /** Current time, ticking while runs are in progress. */
  now: number
}

function runTime(execution: ExecutionSummary, now: number) {
  if (!execution.startedAt) return null
  const end = execution.finishedAt ? Date.parse(execution.finishedAt) : now
  return formatDuration(end - Date.parse(execution.startedAt))
}

const ExecutionRow: FC<IProps> = ({ execution, canEdit, now }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const cancel = useCancelExecution()
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)

  const detailsUrl = `/executions/${execution.id}`
  const finished = isFinished(execution.status)
  const closeMenu = () => setMenuAnchor(null)

  const openMenu = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
  }

  const handleCancel = () => {
    closeMenu()
    cancel.mutate(execution.id, {
      onSuccess: () =>
        dispatch(setAlertAC({ text: 'executions.canceledAlert', mode: 'success' })),
      onError: () =>
        dispatch(setAlertAC({ text: 'executions.cancelFailed', mode: 'error' })),
    })
  }

  return (
    <TableRow
      hover
      onClick={() => navigate(detailsUrl)}
      className="cursor-pointer"
      sx={
        execution.status === 'error'
          ? (theme) => ({ bgcolor: alpha(theme.palette.error.main, 0.08) })
          : undefined
      }
    >
      <TableCell sx={{ maxWidth: 0, width: '45%' }}>
        <Typography variant="body2" noWrap>
          {execution.workflowName}
        </Typography>
        {execution.error && (
          <Typography variant="caption" color="error" noWrap component="div">
            {execution.error.message}
          </Typography>
        )}
      </TableCell>
      <TableCell>
        <Tooltip title={t(`executions.mode.${execution.mode}`)}>
          <span>
            <ExecutionStatusBadge status={execution.status} />
          </span>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {formatDateTime(execution.startedAt ?? execution.createdAt, i18n.language)}
      </TableCell>
      <TableCell sx={{ whiteSpace: 'nowrap', display: { xs: 'none', sm: 'table-cell' } }}>
        {runTime(execution, now) ?? '—'}
      </TableCell>
      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
        <Tooltip title={execution.id}>
          <Typography variant="body2" component="span" sx={{ fontFamily: fonts.mono }}>
            {execution.id.slice(0, 8)}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell align="right" padding="checkbox">
        <IconButton size="small" aria-label={t('common.actions')} onClick={openMenu}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu
          anchorEl={menuAnchor}
          open={!!menuAnchor}
          onClose={closeMenu}
          onClick={(e) => e.stopPropagation()}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => navigate(detailsUrl)}>
            <ListItemIcon>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            {t('executions.actions.open')}
          </MenuItem>
          <MenuItem onClick={() => navigate(`/workflows/${execution.workflowId}`)}>
            <ListItemIcon>
              <AccountTreeOutlinedIcon fontSize="small" />
            </ListItemIcon>
            {t('executions.actions.openWorkflow')}
          </MenuItem>
          {canEdit && !finished && (
            <MenuItem onClick={handleCancel} sx={{ color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'inherit' }}>
                <StopCircleOutlinedIcon fontSize="small" />
              </ListItemIcon>
              {t('executions.actions.cancel')}
            </MenuItem>
          )}
        </Menu>
      </TableCell>
    </TableRow>
  )
}

export default ExecutionRow
