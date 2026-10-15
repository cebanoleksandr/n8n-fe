import { useState, type FC, type MouseEvent } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutlineOutlined'
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlineOutlined'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import type { WorkflowSummary } from '../../api/types'
import {
  useDeleteWorkflow,
  useExportWorkflow,
  useHasRole,
  useSetWorkflowActive,
} from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { downloadJson } from '../../utils/downloadJson'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { formatDay, formatRelative } from '../../utils/formatDate'
import ConfirmPopup from '../popups/ConfirmPopup'

interface IProps {
  workflow: WorkflowSummary
}

const WorkflowCard: FC<IProps> = ({ workflow }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const canEdit = useHasRole('editor')

  const setActive = useSetWorkflowActive()
  const exportWorkflow = useExportWorkflow()
  const remove = useDeleteWorkflow()

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [isDeleteVisible, setIsDeleteVisible] = useState(false)

  const editorUrl = `/workflows/${workflow.id}`
  const closeMenu = () => setMenuAnchor(null)

  const openMenu = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
  }

  const handleToggleActive = () => {
    closeMenu()
    setActive.mutate(
      { id: workflow.id, active: !workflow.active },
      {
        // The server says why, e.g. no Webhook or Schedule trigger to activate.
        onError: (error) =>
          dispatch(setAlertAC({ text: apiErrorMessage(error, t), mode: 'error' })),
      },
    )
  }

  const handleExport = () => {
    closeMenu()
    exportWorkflow.mutate(workflow.id, {
      onSuccess: (data) => downloadJson(data, workflow.name),
      onError: () =>
        dispatch(setAlertAC({ text: 'workflows.exportFailed', mode: 'error' })),
    })
  }

  const handleDelete = () => {
    remove.mutate(workflow.id, {
      onSuccess: () => {
        setIsDeleteVisible(false)
        dispatch(setAlertAC({ text: 'workflows.deleted', mode: 'success' }))
      },
      onError: () => {
        setIsDeleteVisible(false)
        dispatch(setAlertAC({ text: 'workflows.deleteFailed', mode: 'error' }))
      },
    })
  }

  return (
    <>
      <Paper
        onClick={() => navigate(editorUrl)}
        className="flex items-center gap-4 px-4 py-3 cursor-pointer"
        sx={{
          transition: 'border-color 150ms',
          '&:hover': { borderColor: 'text.secondary' },
        }}
      >
        <div className="min-w-0 flex-1">
          {/* A real link too, so it opens in a new tab with a middle click. */}
          <Link
            component={RouterLink}
            to={editorUrl}
            onClick={(e) => e.stopPropagation()}
            underline="none"
            color="text.primary"
            sx={{ fontWeight: 600, display: 'block' }}
            noWrap
          >
            {workflow.name}
          </Link>
          <Typography variant="caption" color="text.secondary" component="div" noWrap>
            {t('common.updated', { when: formatRelative(workflow.updatedAt, i18n.language) })}
            <Box component="span" sx={{ mx: 1, color: 'divider' }}>
              |
            </Box>
            {t('common.created', { when: formatDay(workflow.createdAt, i18n.language) })}
          </Typography>
        </div>

        {workflow.active && (
          <Chip
            size="small"
            variant="outlined"
            label={t('workflow.active')}
            icon={
              <Box
                component="span"
                sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }}
              />
            }
            sx={{ '& .MuiChip-icon': { ml: 1 } }}
          />
        )}

        <IconButton size="small" aria-label={t('common.actions')} onClick={openMenu}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={closeMenu}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => navigate(editorUrl)}>
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          {t('workflows.actions.open')}
        </MenuItem>
        {canEdit && (
          <MenuItem onClick={handleToggleActive}>
            <ListItemIcon>
              {workflow.active ? (
                <PauseCircleOutlineIcon fontSize="small" />
              ) : (
                <PlayCircleOutlineIcon fontSize="small" />
              )}
            </ListItemIcon>
            {t(workflow.active ? 'workflows.actions.deactivate' : 'workflows.actions.activate')}
          </MenuItem>
        )}
        <MenuItem onClick={handleExport}>
          <ListItemIcon>
            <FileDownloadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {t('workflows.actions.export')}
        </MenuItem>
        {canEdit && <Divider />}
        {canEdit && (
          <MenuItem
            onClick={() => {
              closeMenu()
              setIsDeleteVisible(true)
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <DeleteOutlineIcon fontSize="small" />
            </ListItemIcon>
            {t('workflows.actions.delete')}
          </MenuItem>
        )}
      </Menu>

      <ConfirmPopup
        isVisible={isDeleteVisible}
        onClose={() => setIsDeleteVisible(false)}
        onConfirm={handleDelete}
        title={t('workflows.deleteConfirm.title')}
        text={t('workflows.deleteConfirm.text', { name: workflow.name })}
        confirmLabel={t('workflows.actions.delete')}
        danger
        loading={remove.isPending}
      />
    </>
  )
}

export default WorkflowCard
