import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/settings/profile', label: 'Profile' },
  { to: '/settings/workspace', label: 'Workspace' },
  { to: '/settings/members', label: 'Members' },
]

const SettingsLayout = () => {
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex gap-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => (isActive ? 'font-bold' : '')}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}

export default SettingsLayout
