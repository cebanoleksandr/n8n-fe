import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/workflows', label: 'Workflows' },
  { to: '/executions', label: 'Executions' },
  { to: '/credentials', label: 'Credentials' },
  { to: '/settings', label: 'Settings' },
]

const AppLayout = () => {
  return (
    <div className="min-h-screen flex">
      <nav className="w-56 border-r border-gray-200 p-4 flex flex-col gap-2">
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
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
