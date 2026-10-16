import { useState } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ConfirmPopup from '../../components/popups/ConfirmPopup'
import SettingsSection from '../../components/settings/SettingsSection'
import FormTextField from '../../components/ui/FormTextField'
import {
  useCurrentMembership,
  useHasRole,
  useMe,
  useMembers,
  useRemoveMember,
  useRenameWorkspace,
  useSwitchWorkspace,
  useWorkspaceId,
} from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { type WorkspaceNameFormValues, workspaceNameSchema } from './schemas'

const RenameForm = ({ name }: { name: string }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const rename = useRenameWorkspace()

  const { control, handleSubmit, formState, reset } = useForm<WorkspaceNameFormValues>({
    resolver: yupResolver(workspaceNameSchema),
    values: { name },
  })

  const onSubmit = (values: WorkspaceNameFormValues) => {
    rename.mutate(values.name, {
      onSuccess: (workspace) => {
        reset({ name: workspace.name })
        dispatch(setAlertAC({ text: 'settings.workspace.renamed', mode: 'success' }))
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 max-w-sm">
      {rename.isError && <Alert severity="error">{apiErrorMessage(rename.error, t)}</Alert>}
      <FormTextField control={control} name="name" label={t('settings.workspace.name')} size="small" />
      <div>
        <Button type="submit" variant="contained" disabled={!formState.isDirty} loading={rename.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

const WorkspaceSettingsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { data: me } = useMe()
  const workspaceId = useWorkspaceId()
  const membership = useCurrentMembership()
  const isAdmin = useHasRole('admin')
  const switchWorkspace = useSwitchWorkspace()
  const members = useMembers()
  const leave = useRemoveMember()
  const [isLeaveVisible, setIsLeaveVisible] = useState(false)

  if (!me || !membership) return null

  const owners = members.data?.filter((member) => member.role === 'owner').length ?? 0
  const isLastOwner = membership.role === 'owner' && owners <= 1
  const isOnlyWorkspace = me.workspaces.length <= 1
  // Why leaving is not possible, if it isn't.
  const leaveBlocked = isLastOwner
    ? t('settings.workspace.leaveLastOwner')
    : isOnlyWorkspace
      ? t('settings.workspace.leaveOnly')
      : null

  const switchTo = (id: string) => {
    switchWorkspace(id)
    navigate('/workflows')
  }

  const handleLeave = () => {
    leave.mutate(me.id, {
      onSuccess: () => {
        setIsLeaveVisible(false)
        dispatch(setAlertAC({ text: 'settings.workspace.left', mode: 'success' }))
        // /auth/me reloads without it, and the app falls back to another workspace.
        navigate('/workflows')
      },
      onError: (error) => {
        setIsLeaveVisible(false)
        dispatch(setAlertAC({ text: apiErrorMessage(error, t), mode: 'error' }))
      },
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <SettingsSection
        title={t('settings.workspace.general')}
        description={isAdmin ? undefined : t('settings.workspace.adminsOnly')}
      >
        {isAdmin ? (
          <RenameForm name={membership.workspaceName} />
        ) : (
          <Typography sx={{ fontWeight: 600 }}>{membership.workspaceName}</Typography>
        )}
      </SettingsSection>

      <SettingsSection
        title={t('settings.workspace.yours')}
        description={t('settings.workspace.yoursHint')}
      >
        <List disablePadding className="flex flex-col gap-1">
          {me.workspaces.map((workspace) => {
            const current = workspace.workspaceId === workspaceId
            return (
              <ListItem
                key={workspace.workspaceId}
                disableGutters
                className="flex items-center gap-3"
                sx={{ py: 0.5 }}
              >
                <Typography className="flex-1 min-w-0" noWrap sx={{ fontWeight: current ? 600 : 400 }}>
                  {workspace.workspaceName}
                </Typography>
                <Chip size="small" variant="outlined" label={t(`roles.${workspace.role}`)} />
                {current ? (
                  <Chip size="small" color="primary" label={t('settings.workspace.current')} />
                ) : (
                  <Button size="small" onClick={() => switchTo(workspace.workspaceId)}>
                    {t('settings.workspace.switch')}
                  </Button>
                )}
              </ListItem>
            )
          })}
        </List>
      </SettingsSection>

      <SettingsSection
        danger
        title={t('settings.workspace.leave')}
        description={leaveBlocked ?? t('settings.workspace.leaveHint')}
      >
        <div>
          <Button
            color="error"
            variant="outlined"
            disabled={!!leaveBlocked || members.isPending}
            onClick={() => setIsLeaveVisible(true)}
          >
            {t('settings.workspace.leave')}
          </Button>
        </div>
      </SettingsSection>

      <ConfirmPopup
        isVisible={isLeaveVisible}
        onClose={() => setIsLeaveVisible(false)}
        onConfirm={handleLeave}
        title={t('settings.workspace.leaveConfirm.title', { name: membership.workspaceName })}
        text={t('settings.workspace.leaveConfirm.text')}
        confirmLabel={t('settings.workspace.leave')}
        danger
        loading={leave.isPending}
      />
    </div>
  )
}

export default WorkspaceSettingsPage
