import { useState, type FC } from 'react'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import PersonRemoveOutlinedIcon from '@mui/icons-material/PersonRemoveOutlined'
import { useTranslation } from 'react-i18next'
import type { Member, Role } from '../../api/types'
import { useChangeMemberRole, useMembers, useRemoveMember } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { formatDay } from '../../utils/formatDate'
import { canManageMember, grantableRoles } from '../../utils/roles'
import ConfirmPopup from '../popups/ConfirmPopup'

interface IProps {
  myId: string
  myRole: Role
}

/** Everyone in the workspace; admins change roles and remove members. */
const MembersTable: FC<IProps> = ({ myId, myRole }) => {
  const { t, i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const members = useMembers()
  const changeRole = useChangeMemberRole()
  const remove = useRemoveMember()
  const [removing, setRemoving] = useState<Member | null>(null)

  const onError = (error: unknown) => dispatch(setAlertAC({ text: apiErrorMessage(error, t), mode: 'error' }))

  const handleRemove = () => {
    if (!removing) return
    remove.mutate(removing.userId, {
      onSuccess: () => {
        setRemoving(null)
        dispatch(setAlertAC({ text: 'settings.members.removed', mode: 'success' }))
      },
      onError: (error) => {
        setRemoving(null)
        onError(error)
      },
    })
  }

  if (members.isPending) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={48} />
        ))}
      </div>
    )
  }
  if (members.isError) return <Typography color="error">{apiErrorMessage(members.error, t)}</Typography>

  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('settings.members.member')}</TableCell>
            <TableCell>{t('settings.members.role')}</TableCell>
            <TableCell>{t('settings.members.joined')}</TableCell>
            <TableCell padding="checkbox" />
          </TableRow>
        </TableHead>
        <TableBody>
          {members.data.map((member) => {
            const isMe = member.userId === myId
            // Your own role and membership are changed by others (or by leaving).
            const manageable = !isMe && canManageMember(myRole, member.role)
            const roles = grantableRoles(myRole)
            return (
              <TableRow key={member.userId}>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: 'action.selected', color: 'text.primary' }}>
                      {member.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div className="min-w-0">
                      {/* A div: the "You" chip is a div, which a <p> can't hold. */}
                      <Typography variant="body2" component="div" noWrap sx={{ fontWeight: 600 }}>
                        {member.name}
                        {isMe && <Chip size="small" label={t('settings.members.you')} sx={{ ml: 1, height: 18 }} />}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {member.email}
                      </Typography>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {manageable ? (
                    <Select
                      size="small"
                      value={member.role}
                      disabled={changeRole.isPending}
                      onChange={(e) =>
                        changeRole.mutate(
                          { userId: member.userId, role: e.target.value as Role },
                          {
                            onSuccess: () =>
                              dispatch(setAlertAC({ text: 'settings.members.roleChanged', mode: 'success' })),
                            onError,
                          },
                        )
                      }
                      inputProps={{ 'aria-label': t('settings.members.role') }}
                      sx={{ minWidth: 130 }}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {t(`roles.${role}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <Chip size="small" variant="outlined" label={t(`roles.${member.role}`)} />
                  )}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDay(member.joinedAt, i18n.language)}</TableCell>
                <TableCell padding="checkbox">
                  {manageable && (
                    <Tooltip title={t('settings.members.remove')}>
                      <IconButton size="small" onClick={() => setRemoving(member)}>
                        <PersonRemoveOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <ConfirmPopup
        isVisible={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        title={t('settings.members.removeConfirm.title', { name: removing?.name ?? '' })}
        text={t('settings.members.removeConfirm.text')}
        confirmLabel={t('settings.members.remove')}
        danger
        loading={remove.isPending}
      />
    </>
  )
}

export default MembersTable
