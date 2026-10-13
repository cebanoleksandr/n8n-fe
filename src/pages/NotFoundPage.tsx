import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import HubOutlinedIcon from '@mui/icons-material/HubOutlined'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // Opened directly (no history in this tab), "back" would leave the app.
  const canGoBack = window.history.state?.idx > 0

  return (
    <Box
      className="min-h-screen flex items-center justify-center p-6"
      sx={{ bgcolor: 'background.default' }}
    >
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <HubOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
        <Typography
          component="p"
          sx={{ fontSize: '6rem', fontWeight: 700, lineHeight: 1, color: 'primary.main' }}
        >
          404
        </Typography>
        <Typography variant="h2">{t('notFound.title')}</Typography>
        <Typography color="text.secondary">{t('notFound.text')}</Typography>

        <div className="flex gap-2 mt-2">
          {canGoBack && (
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
              {t('notFound.back')}
            </Button>
          )}
          {/* Signed out, the route guard forwards this to login. */}
          <Button variant="contained" component={RouterLink} to="/">
            {t('notFound.home')}
          </Button>
        </div>
      </div>
    </Box>
  )
}

export default NotFoundPage
