import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'
import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'
import { useMe } from '../../hooks/api'
import LogoutPopup from '../popups/LogoutPopup'

const links = [
  { to: '/workflows', label: 'nav.workflows' },
  { to: '/executions', label: 'nav.executions' },
  { to: '/credentials', label: 'nav.credentials' },
  { to: '/settings', label: 'nav.settings' },
]

const AppLayout = () => {
  const { t } = useTranslation()
  const { data: me } = useMe()
  const [isLogoutVisible, setIsLogoutVisible] = useState(false)

  return (
    <div className="min-h-screen flex">
      <Box
        component="nav"
        className="w-56 p-4 flex flex-col gap-2"
        sx={{ borderRight: 1, borderColor: 'divider' }}
      >
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'font-bold' : '')}
          >
            {t(link.label)}
          </NavLink>
        ))}

        <div className="mt-auto flex flex-col gap-2">
          {me && (
            <div className="min-w-0">
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {me.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap component="div">
                {me.email}
              </Typography>
            </div>
          )}
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={() => setIsLogoutVisible(true)}
          >
            {t('nav.logout')}
          </Button>
        </div>
      </Box>
      <main className="flex-1 p-6">
        <Outlet />
      </main>

      <LogoutPopup isVisible={isLogoutVisible} onClose={() => setIsLogoutVisible(false)} />
    </div>
  )
}

export default AppLayout
