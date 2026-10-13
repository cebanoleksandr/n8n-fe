import { useState, type FC, type MouseEvent } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useTranslation } from 'react-i18next'
import type { Credential } from '../../api/types'
import { useDeleteCredential } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { formatDay, formatRelative } from '../../utils/formatDate'
import ConfirmPopup from '../popups/ConfirmPopup'
import CredentialTypeAvatar from './CredentialTypeAvatar'

interface IProps {
  credential: Credential
  /** Display name of its type; the raw type when the type is unknown. */
  typeName: string
  /** Absent for viewers, who can't open credentials. */
  onEdit?: () => void
}

/** Needs the user to sign in at the provider: authorization-code OAuth2. */
function needsConnecting(credential: Credential) {
  return (
    !!credential.oauth2 &&
    !credential.oauth2.connected &&
    credential.data.grantType !== 'clientCredentials'
  )
}

const CredentialCard: FC<IProps> = ({ credential, typeName, onEdit }) => {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const remove = useDeleteCredential()

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [isDeleteVisible, setIsDeleteVisible] = useState(false)

  const closeMenu = () => setMenuAnchor(null)

  const openMenu = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setMenuAnchor(e.currentTarget)
  }

  const handleDelete = () => {
    remove.mutate(credential.id, {
      onSuccess: () => {
        setIsDeleteVisible(false)
        dispatch(setAlertAC({ text: 'credentials.deleted', mode: 'success' }))
      },
      onError: () => {
        setIsDeleteVisible(false)
        dispatch(setAlertAC({ text: 'credentials.deleteFailed', mode: 'error' }))
      },
    })
  }

  return (
    <>
      <Paper
        onClick={onEdit}
        className={`flex items-center gap-3 px-4 py-3 ${onEdit ? 'cursor-pointer' : ''}`}
        sx={{
          transition: 'border-color 150ms',
          '&:hover': onEdit ? { borderColor: 'text.secondary' } : undefined,
        }}
      >
        <CredentialTypeAvatar type={credential.type} displayName={typeName} />

        <div className="min-w-0 flex-1">
          <Typography noWrap sx={{ fontWeight: 600 }}>
            {credential.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div" noWrap>
            {typeName}
            <Box component="span" sx={{ mx: 1, color: 'divider' }}>
              |
            </Box>
            {t('common.updated', { when: formatRelative(credential.updatedAt, i18n.language) })}
            <Box component="span" sx={{ mx: 1, color: 'divider' }}>
              |
            </Box>
            {t('common.created', { when: formatDay(credential.createdAt, i18n.language) })}
          </Typography>
        </div>

        {needsConnecting(credential) && (
          <Chip size="small" color="warning" variant="outlined" label={t('credentials.oauth2.notConnected')} />
        )}

        {onEdit && (
          <IconButton size="small" aria-label={t('common.actions')} onClick={openMenu}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        )}
      </Paper>

      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={closeMenu}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            closeMenu()
            onEdit?.()
          }}
        >
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {t('credentials.actions.edit')}
        </MenuItem>
        <Divider />
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
          {t('credentials.actions.delete')}
        </MenuItem>
      </Menu>

      <ConfirmPopup
        isVisible={isDeleteVisible}
        onClose={() => setIsDeleteVisible(false)}
        onConfirm={handleDelete}
        title={t('credentials.deleteConfirm.title')}
        text={t('credentials.deleteConfirm.text', { name: credential.name })}
        confirmLabel={t('credentials.actions.delete')}
        danger
        loading={remove.isPending}
      />
    </>
  )
}

export default CredentialCard
