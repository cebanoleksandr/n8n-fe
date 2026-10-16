import { useTranslation } from 'react-i18next'
import { InviteForm, PendingInvitations } from '../../components/settings/InviteMembers'
import MembersTable from '../../components/settings/MembersTable'
import SettingsSection from '../../components/settings/SettingsSection'
import { useCurrentMembership, useMe } from '../../hooks/api'
import { hasRole } from '../../api/types'

const MembersSettingsPage = () => {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const membership = useCurrentMembership()
  if (!me || !membership) return null

  const isAdmin = hasRole(membership.role, 'admin')

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <SettingsSection
          title={t('settings.members.inviteTitle')}
          description={t('settings.members.inviteHint')}
        >
          <InviteForm myRole={membership.role} />
        </SettingsSection>
      )}

      <SettingsSection
        title={t('settings.members.title')}
        description={isAdmin ? undefined : t('settings.members.viewOnly')}
      >
        <MembersTable myId={me.id} myRole={membership.role} />
      </SettingsSection>

      {isAdmin && (
        <SettingsSection title={t('settings.members.pending')}>
          <PendingInvitations />
        </SettingsSection>
      )}
    </div>
  )
}

export default MembersSettingsPage
