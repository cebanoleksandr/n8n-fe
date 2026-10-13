import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import AppLoader from './components/ui/AppLoader'
import CustomAlert from './components/ui/CustomAlert'
import router from './router'

function App() {
  return (
    <Suspense fallback={<AppLoader />}>
      <RouterProvider router={router} />
      <CustomAlert />
    </Suspense>
  )
}

export default App
