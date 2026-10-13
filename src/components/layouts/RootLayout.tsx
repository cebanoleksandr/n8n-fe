import { Outlet } from 'react-router-dom'
import NavigationProgress from '../ui/NavigationProgress'

/** Wraps every route: the loading bar shared by all pages. */
const RootLayout = () => (
  <>
    <NavigationProgress />
    <Outlet />
  </>
)

export default RootLayout
