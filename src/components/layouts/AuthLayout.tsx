import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <Box
      className="min-h-dvh flex items-center justify-center p-4"
      sx={{ bgcolor: 'background.default' }}
    >
      <Paper className="w-full max-w-md p-6 sm:p-8">
        <Outlet />
      </Paper>
    </Box>
  )
}

export default AuthLayout
