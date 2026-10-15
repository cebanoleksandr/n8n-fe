import { useState, type FC } from 'react'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Workflow } from '../../api/types'
import { useDeleteWorkflow, useExportWorkflow } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { downloadJson } from '../../utils/downloadJson'
import ConfirmPopup from '../popups/ConfirmPopup'

interface IProps {
  workflow: Workflow
  canEdit: boolean
}

/** The "…" next to the workflow name: download and delete. */
const WorkflowMenu: FC<IProps> = ({ workflow, canEdit }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const exportWorkflow = useExportWorkflow()
  const remove = useDeleteWorkflow()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [isDeleteVisible, setIsDeleteVisible] = useState(false)

  const handleExport = () => {
    setAnchor(null)
    exportWorkflow.mutate(workflow.id, {
      onSuccess: (data) => downloadJson(data, workflow.name),
      onError: () => dispatch(setAlertAC({ text: 'workflows.exportFailed', mode: 'error' })),
    })
  }

  const handleDelete = () => {
    remove.mutate(workflow.id, {
      onSuccess: () => {
        dispatch(setAlertAC({ text: 'workflows.deleted', mode: 'success' }))
        navigate('/workflows', { replace: true })
      },
      onError: () => {
        setIsDeleteVisible(false)
        dispatch(setAlertAC({ text: 'workflows.deleteFailed', mode: 'error' }))
      },
    })
  }

  return (
    <>
      <IconButton size="small" aria-label={t('common.actions')} onClick={(e) => setAnchor(e.currentTarget)}>
        <MoreHorizIcon fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
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
              setAnchor(null)
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

export default WorkflowMenu
