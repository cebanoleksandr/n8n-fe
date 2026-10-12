import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import { Provider } from 'react-redux'
import './index.css'
import './i18n'
import App from './App.tsx'
import { queryClient } from './api/query-client'
import { store } from './storage/store'
import theme from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <App />
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
          </QueryClientProvider>
        </Provider>
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
)
