import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

/** Full-screen spinner while the app starts (translations, first page). No text: translations may not be loaded yet. */
const AppLoader = () => (
  <Box className="min-h-screen flex items-center justify-center" sx={{ bgcolor: 'background.default' }}>
    <CircularProgress />
  </Box>
)

export default AppLoader
