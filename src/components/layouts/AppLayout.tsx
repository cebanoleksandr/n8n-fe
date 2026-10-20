import { useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import ListItemButton from '@mui/material/ListItemButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'
import { useTranslation } from 'react-i18next'
import { matchPath, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '../../hooks/api'
import { useCreateWorkflowAndOpen } from '../../hooks/useCreateWorkflowAndOpen'
import { useIsMobile } from '../../hooks/useIsMobile'
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
  const isMobile = useIsMobile()
  const [storedCollapsed, setCollapsed] = useState(readCollapsed)
  // Phones get the full menu in a drawer instead of a narrow sidebar.
  const collapsed = storedCollapsed && !isMobile
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isLogoutVisible, setIsLogoutVisible] = useState(false)

  // A link in the drawer was followed: close it.
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setIsDrawerOpen(false)
  }

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

  const createButton = (
    <Tooltip title={t('workflows.create')}>
      <IconButton size="small" onClick={createAndOpen} disabled={isCreating} aria-label={t('workflows.create')}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )

  const navContent = (
    <>
      <div className={`flex items-center gap-1 mb-2 ${collapsed ? 'flex-col' : ''}`}>
        <div className="flex items-center gap-1.5 px-1 py-1 min-w-0 flex-1">
          <HubOutlinedIcon color="primary" />
          {!collapsed && (
            <Typography variant="h5" noWrap>
              {t('app.name')}
            </Typography>
          )}
        </div>
        {createButton}
        {!isMobile && (
          <Tooltip title={t(collapsed ? 'nav.expand' : 'nav.collapse')}>
            <IconButton size="small" onClick={toggleCollapsed}>
              <ViewSidebarOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
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
    </>
  )

  return (
    // dvh: the visible height on phones, without the browser's toolbars.
    <div className={`h-dvh flex overflow-hidden ${isMobile ? 'flex-col' : ''}`}>
      {isMobile ? (
        <>
          <Box
            component="header"
            className="shrink-0 flex items-center gap-1 px-2 h-12"
            sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
          >
            <IconButton onClick={() => setIsDrawerOpen(true)} aria-label={t('nav.menu')}>
              <MenuIcon />
            </IconButton>
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <HubOutlinedIcon color="primary" />
              <Typography variant="h5" noWrap>
                {t('app.name')}
              </Typography>
            </div>
            {createButton}
          </Box>
          <Drawer
            open={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            slotProps={{ paper: { component: 'nav', className: 'flex flex-col gap-1 p-2', sx: { width: 260, border: 0 } } }}
          >
            {navContent}
          </Drawer>
        </>
      ) : (
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
          {navContent}
        </Box>
      )}

      {/* No padding: the editor fills it edge to edge; inner layouts add their own. */}
      <main className="flex-1 min-w-0 min-h-0 overflow-auto">
        <Outlet />
      </main>

      <LogoutPopup isVisible={isLogoutVisible} onClose={() => setIsLogoutVisible(false)} />
    </div>
  )
}

export default AppLayout
