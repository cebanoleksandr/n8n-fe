import { useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ListItemButton from '@mui/material/ListItemButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'
import { useTranslation } from 'react-i18next'
import { matchPath, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '../../hooks/api'
import { useCreateWorkflowAndOpen } from '../../hooks/useCreateWorkflowAndOpen'
import LogoutPopup from '../popups/LogoutPopup'

const COLLAPSED_KEY = 'flow:sidebarCollapsed'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  /** Paths that highlight the item; defaults to `to` and everything under it. */
  match?: string[]
}

const topItems: NavItem[] = [
  {
    to: '/workflows',
    label: 'nav.overview',
    icon: <HomeOutlinedIcon fontSize="small" />,
    // The overview tabs, not the editor under /workflows/:id.
    match: ['/workflows', '/credentials', '/executions'],
  },
]

const bottomItems: NavItem[] = [
  { to: '/settings', label: 'nav.settings', icon: <SettingsOutlinedIcon fontSize="small" /> },
]

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

const AppLayout = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { data: me } = useMe()
  const { createAndOpen, isPending: isCreating } = useCreateWorkflowAndOpen()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [isLogoutVisible, setIsLogoutVisible] = useState(false)

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1')
      } catch {
        // Storage unavailable: the choice lasts for this page only.
      }
      return !value
    })
  }

  const isSelected = (item: NavItem) =>
    item.match
      ? item.match.some((path) => matchPath({ path, end: true }, pathname))
      : !!matchPath({ path: item.to, end: false }, pathname)

  const renderItem = (item: NavItem) => (
    <Tooltip key={item.to} title={collapsed ? t(item.label) : ''} placement="right">
      <ListItemButton
        component={NavLink}
        to={item.to}
        selected={isSelected(item)}
        // ListItemButton grows by default, which stretches it in the column.
        sx={{ flexGrow: 0, borderRadius: 1, gap: 1.5, px: 1, py: 0.75, minHeight: 36 }}
      >
        {item.icon}
        {!collapsed && (
          <Typography variant="body2" noWrap>
            {t(item.label)}
          </Typography>
        )}
      </ListItemButton>
    </Tooltip>
  )

  return (
    <div className="h-screen flex overflow-hidden">
      <Box
        component="nav"
        className="shrink-0 flex flex-col gap-1 p-2"
        sx={{
          width: collapsed ? 56 : 220,
          transition: 'width 150ms',
          borderRight: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <div className={`flex items-center gap-1 mb-2 ${collapsed ? 'flex-col' : ''}`}>
          <div className="flex items-center gap-1.5 px-1 py-1 min-w-0 flex-1">
            <HubOutlinedIcon color="primary" />
            {!collapsed && (
              <Typography variant="h5" noWrap>
                {t('app.name')}
              </Typography>
            )}
          </div>
          <Tooltip title={t('workflows.create')}>
            <IconButton size="small" onClick={createAndOpen} disabled={isCreating}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t(collapsed ? 'nav.expand' : 'nav.collapse')}>
            <IconButton size="small" onClick={toggleCollapsed}>
              <ViewSidebarOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>

        {topItems.map(renderItem)}

        <div className="mt-auto flex flex-col gap-1">
          {bottomItems.map(renderItem)}

          <Box
            className={`flex items-center gap-2 mt-1 pt-2 px-1 ${collapsed ? 'justify-center' : ''}`}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          >
            {me && !collapsed && (
              <div className="min-w-0 flex-1">
                <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                  {me.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {me.email}
                </Typography>
              </div>
            )}
            <Tooltip title={t('nav.logout')}>
              <IconButton size="small" onClick={() => setIsLogoutVisible(true)}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </div>
      </Box>

      {/* No padding: the editor fills it edge to edge; inner layouts add their own. */}
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>

      <LogoutPopup isVisible={isLogoutVisible} onClose={() => setIsLogoutVisible(false)} />
    </div>
  )
}

export default AppLayout
