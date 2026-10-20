import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

/** Below MUI's `md` breakpoint (900px): phones and small tablets. */
export function useIsMobile() {
  const theme = useTheme()
  return useMediaQuery(theme.breakpoints.down('md'), { noSsr: true })
}

/** A finger, not a mouse: no hover, double-click or Delete key. */
export function useIsTouch() {
  return useMediaQuery('(pointer: coarse)', { noSsr: true })
}
