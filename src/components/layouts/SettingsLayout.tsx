import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/settings/profile', label: 'nav.profile' },
  { to: '/settings/workspace', label: 'nav.workspace' },
  { to: '/settings/members', label: 'nav.members' },
]

const SettingsLayout = () => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'font-bold' : '')}
          >
            {t(link.label)}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

export default SettingsLayout
