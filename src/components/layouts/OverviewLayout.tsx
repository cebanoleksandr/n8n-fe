import Button from '@mui/material/Button'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCreateWorkflowAndOpen } from '../../hooks/useCreateWorkflowAndOpen'

const tabs = [
  { to: '/workflows', label: 'nav.workflows' },
  { to: '/credentials', label: 'nav.credentials' },
  { to: '/executions', label: 'nav.executions' },
]

/** Workflows, credentials and executions as tabs under one header. */
const OverviewLayout = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { createAndOpen, isPending } = useCreateWorkflowAndOpen()

  const current = tabs.find((tab) => pathname === tab.to)?.to ?? false

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Typography variant="h2">{t('overview.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('overview.subtitle')}
          </Typography>
        </div>
        <Button variant="contained" onClick={createAndOpen} loading={isPending}>
          {t('workflows.create')}
        </Button>
      </div>

      <Tabs value={current} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        {tabs.map((tab) => (
          <Tab
            key={tab.to}
            value={tab.to}
            label={t(tab.label)}
            component={NavLink}
            to={tab.to}
          />
        ))}
      </Tabs>

      <Outlet />
    </div>
  )
}

export default OverviewLayout
