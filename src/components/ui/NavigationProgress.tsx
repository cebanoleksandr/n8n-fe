import LinearProgress from '@mui/material/LinearProgress'
import { useNavigation } from 'react-router-dom'

/** Thin bar at the top while a navigation loads (a lazy page's code, loaders). */
const NavigationProgress = () => {
  const navigation = useNavigation()
  if (navigation.state !== 'loading') return null
  return (
    <LinearProgress
      sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.appBar + 1, height: 2 }}
    />
  )
}

export default NavigationProgress
