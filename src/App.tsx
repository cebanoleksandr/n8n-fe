import { Suspense } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import { RouterProvider } from 'react-router-dom'
import CustomAlert from './components/ui/CustomAlert'
import router from './router'

// Shown while the translations load, so it has no text.
const AppLoader = () => (
  <Box className="min-h-screen flex items-center justify-center">
    <CircularProgress />
  </Box>
)

function App() {
  return (
    <Suspense fallback={<AppLoader />}>
      <RouterProvider router={router} />
      <CustomAlert />
    </Suspense>
  )
}

export default App
