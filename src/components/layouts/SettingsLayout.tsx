import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const tabs = [
  { to: '/settings/profile', label: 'nav.profile' },
  { to: '/settings/workspace', label: 'nav.workspace' },
  { to: '/settings/members', label: 'nav.members' },
]

/** Settings pages as tabs under one header, like the overview. */
const SettingsLayout = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const current = tabs.find((tab) => pathname === tab.to)?.to ?? false

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-4">
      <div>
        <Typography variant="h2">{t('settings.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('settings.subtitle')}
        </Typography>
      </div>

      <Tabs value={current} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((tab) => (
          <Tab key={tab.to} value={tab.to} label={t(tab.label)} component={NavLink} to={tab.to} />
        ))}
      </Tabs>

      <Outlet />
    </div>
  )
}

export default SettingsLayout
