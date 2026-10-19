import { useState, type FC } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { getErrorStatus } from '../../api/client'
import type { CreatedInvitation, Role } from '../../api/types'
import { useInvitations, useInvite, useRevokeInvitation } from '../../hooks/api'
import { type InviteFormValues, inviteSchema } from '../../pages/settings/schemas'
import { routeUrl } from '../../router/basename'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { fonts } from '../../theme'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { formatRelative } from '../../utils/formatDate'
import { grantableRoles } from '../../utils/roles'
import BasePopup from '../popups/BasePopup'
import FormTextField from '../ui/FormTextField'

/** The page an invitee opens: AcceptInvitationPage. */
function inviteLink(token: string) {
  return routeUrl(`/auth/invite/${encodeURIComponent(token)}`)
}

/** The link is returned once: show it right away, ready to copy and send. */
const InviteLinkPopup: FC<{ invitation: CreatedInvitation | null; onClose: () => void }> = ({
  invitation,
  onClose,
}) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const link = invitation ? inviteLink(invitation.token) : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      dispatch(setAlertAC({ text: 'common.copied', mode: 'success' }))
    } catch {
      // Clipboard blocked: the field is still selectable.
    }
  }

  return (
    <BasePopup isVisible={!!invitation} onClose={onClose} style={{ width: 560, maxWidth: '92vw', padding: 24 }}>
      <div className="flex flex-col gap-4">
        <Typography variant="h3">{t('settings.members.linkTitle')}</Typography>
        <Typography color="text.secondary">
          {t('settings.members.linkText', { email: invitation?.email ?? '' })}
        </Typography>
        <TextField
          value={link}
          fullWidth
          size="small"
          onFocus={(e) => e.target.select()}
          slotProps={{
            input: {
              readOnly: true,
              sx: { fontFamily: fonts.mono, fontSize: 13 },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={copy} aria-label={t('common.copy')}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Alert severity="warning">{t('settings.members.linkOnce')}</Alert>
        <div className="flex justify-end">
          <Button variant="contained" onClick={onClose}>
            {t('settings.members.done')}
          </Button>
        </div>
      </div>
    </BasePopup>
  )
}

/** Admins invite by email: no mail is sent yet, so the result is a link to share. */
export const InviteForm: FC<{ myRole: Role }> = ({ myRole }) => {
  const { t } = useTranslation()
  const invite = useInvite()
  const roles = grantableRoles(myRole)
  const [role, setRole] = useState<Role>('editor')
  const [created, setCreated] = useState<CreatedInvitation | null>(null)

  const { control, handleSubmit, reset, setError } = useForm<InviteFormValues>({
    resolver: yupResolver(inviteSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = ({ email }: InviteFormValues) => {
    invite.mutate(
      { email, role },
      {
        onSuccess: (invitation) => {
          reset()
          setCreated(invitation)
        },
        onError: (error) => {
          if (getErrorStatus(error) === 409) setError('email', { message: 'settings.members.alreadyMember' })
        },
      },
    )
  }

  const formError =
    invite.isError && getErrorStatus(invite.error) !== 409 ? apiErrorMessage(invite.error, t) : null

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
        {formError && <Alert severity="error">{formError}</Alert>}
        <div className="flex items-start gap-2 flex-wrap">
          <div className="flex-1 min-w-60">
            <FormTextField
              control={control}
              name="email"
              type="email"
              size="small"
              placeholder="colleague@company.com"
              slotProps={{ htmlInput: { 'aria-label': t('auth.fields.email') } }}
            />
          </div>
          <TextField
            select
            size="small"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            slotProps={{ htmlInput: { 'aria-label': t('settings.members.role') } }}
            sx={{ minWidth: 140 }}
          >
            {roles.map((value) => (
              <MenuItem key={value} value={value}>
                {t(`roles.${value}`)}
              </MenuItem>
            ))}
          </TextField>
          <Button
            type="submit"
            variant="contained"
            startIcon={<PersonAddAlt1OutlinedIcon />}
            loading={invite.isPending}
            sx={{ height: 37 }}
          >
            {t('settings.members.invite')}
          </Button>
        </div>
        <Typography variant="caption" color="text.secondary">
          {t(`roles.hints.${role}`)}
        </Typography>
      </form>

      <InviteLinkPopup invitation={created} onClose={() => setCreated(null)} />
    </>
  )
}

/** Invitations not accepted yet; a new one for the same email replaces the old. */
export const PendingInvitations: FC = () => {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const invitations = useInvitations()
  const revoke = useRevokeInvitation()

  if (invitations.isPending) return null
  if (invitations.isError) return <Typography color="error">{apiErrorMessage(invitations.error, t)}</Typography>
  if (invitations.data.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('settings.members.noInvitations')}
      </Typography>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {invitations.data.map((invitation) => (
        <div key={invitation.id} className="flex items-center gap-3">
          <Typography variant="body2" className="flex-1 min-w-0" noWrap>
            {invitation.email}
          </Typography>
          <Chip size="small" variant="outlined" label={t(`roles.${invitation.role}`)} />
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {t('settings.members.expires', { when: formatRelative(invitation.expiresAt, i18n.language) })}
          </Typography>
          <Tooltip title={t('settings.members.revoke')}>
            <IconButton
              size="small"
              disabled={revoke.isPending}
              onClick={() =>
                revoke.mutate(invitation.id, {
                  onSuccess: () => dispatch(setAlertAC({ text: 'settings.members.revoked', mode: 'success' })),
                  onError: (error) => dispatch(setAlertAC({ text: apiErrorMessage(error, t), mode: 'error' })),
                })
              }
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ))}
    </div>
  )
}
