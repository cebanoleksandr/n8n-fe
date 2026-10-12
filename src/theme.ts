import { createTheme } from '@mui/material/styles'

/**
 * App colors and fonts. MUI also emits the palette as CSS variables
 * (--mui-palette-*). Dark mode is the `dark` class on <html>.
 */

export const fonts = {
  sans: '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace',
}

export const colors = {
  brand: {
    50: '#fff1ee',
    100: '#ffded7',
    200: '#ffbcae',
    300: '#ff9480',
    400: '#ff7a64',
    500: '#ff6d5a',
    600: '#ea4b36',
    700: '#c43a27',
    800: '#9c2f20',
    900: '#7a271c',
  },
  accent: {
    100: '#ece9fe',
    300: '#b4a8fb',
    500: '#7c5cf5',
    700: '#5a3bd1',
  },
  gray: {
    0: '#ffffff',
    50: '#f8f9fb',
    100: '#f1f3f6',
    200: '#e4e7ec',
    300: '#d0d5dd',
    400: '#98a2b3',
    500: '#667085',
    600: '#475467',
    700: '#344054',
    800: '#1d2433',
    900: '#141a26',
    950: '#0c1018',
  },
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#2563eb',
}

/** Execution status colors, used by badges and canvas node outlines. */
export const statusColors = {
  success: colors.success,
  error: colors.error,
  running: colors.info,
  waiting: colors.warning,
  canceled: colors.gray[400],
}

const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: colors.brand[500], dark: colors.brand[600], contrastText: '#fff' },
        secondary: { main: colors.accent[500], dark: colors.accent[700], contrastText: '#fff' },
        success: { main: colors.success },
        warning: { main: colors.warning },
        error: { main: colors.error },
        info: { main: colors.info },
        background: { default: colors.gray[50], paper: colors.gray[0] },
        text: { primary: colors.gray[800], secondary: colors.gray[500] },
        divider: colors.gray[200],
      },
    },
    dark: {
      palette: {
        primary: { main: colors.brand[500], dark: colors.brand[600], contrastText: '#fff' },
        secondary: { main: colors.accent[300], dark: colors.accent[500], contrastText: colors.gray[950] },
        success: { main: colors.success },
        warning: { main: colors.warning },
        error: { main: colors.error },
        info: { main: colors.info },
        background: { default: colors.gray[950], paper: colors.gray[900] },
        text: { primary: colors.gray[100], secondary: colors.gray[400] },
        divider: colors.gray[800],
      },
    },
  },
  typography: {
    fontFamily: fonts.sans,
    fontSize: 14,
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.5rem', fontWeight: 700 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    h4: { fontSize: '1.125rem', fontWeight: 600 },
    h5: { fontSize: '1rem', fontWeight: 600 },
    h6: { fontSize: '0.875rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },
  },
})

export default theme
