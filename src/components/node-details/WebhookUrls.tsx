import { useEffect, useState, type FC } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import SensorsIcon from '@mui/icons-material/Sensors'
import { useTranslation } from 'react-i18next'
import { useWebhookUrls } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { fonts } from '../../theme'

export interface TestWebhookControl {
  /** When listening ends (ms since epoch), or null. */
  until: number | null
  isStarting: boolean
  onListen: () => void
  onStop: () => void
}

interface IProps {
  method: string
  path: string
  canEdit: boolean
  testWebhook: TestWebhookControl
}

/** Seconds left until `until`, ticking. */
function useSecondsLeft(until: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!until) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [until])
  return until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0
}

/** The Webhook node's test and production URLs, and "Listen for test event". */
const WebhookUrls: FC<IProps> = ({ method, path, canEdit, testWebhook }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const urls = useWebhookUrls()
  const [kind, setKind] = useState<'test' | 'production'>('test')
  const secondsLeft = useSecondsLeft(testWebhook.until)

  // As the backend normalizes it: no leading or trailing slashes.
  const cleanPath = path.trim().replace(/^\/+|\/+$/g, '')
  const url = urls.data && cleanPath ? `${urls.data[kind]}/${cleanPath}` : null

  const copy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      dispatch(setAlertAC({ text: 'common.copied', mode: 'success' }))
    } catch {
      // Clipboard blocked: the URL is still selectable.
    }
  }

  return (
    <Paper className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {t('nodeDetails.webhook.title')}
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={kind}
          onChange={(_, value) => value && setKind(value)}
        >
          <ToggleButton value="test" sx={{ py: 0.25 }}>
            {t('nodeDetails.webhook.test')}
          </ToggleButton>
          <ToggleButton value="production" sx={{ py: 0.25 }}>
            {t('nodeDetails.webhook.production')}
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {url ? (
        <div className="flex items-center gap-2 min-w-0">
          <Chip size="small" label={method} />
          <Box
            className="flex-1 min-w-0 break-all"
            sx={{ fontFamily: fonts.mono, fontSize: 13, userSelect: 'all' }}
          >
            {url}
          </Box>
          <Tooltip title={t('common.copy')}>
            <IconButton size="small" onClick={copy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t('nodeDetails.webhook.setPath')}
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary">
        {t(kind === 'test' ? 'nodeDetails.webhook.testHint' : 'nodeDetails.webhook.productionHint')}
      </Typography>

      {kind === 'test' && canEdit && url && (
        testWebhook.until ? (
          <div className="flex items-center gap-3">
            <CircularProgress size={18} />
            <Typography variant="body2" className="flex-1">
              {t('nodeDetails.webhook.waiting', { seconds: secondsLeft })}
            </Typography>
            <Button size="small" onClick={testWebhook.onStop}>
              {t('nodeDetails.webhook.stop')}
            </Button>
          </div>
        ) : (
          <div>
            <Button
              variant="outlined"
              startIcon={<SensorsIcon />}
              onClick={testWebhook.onListen}
              loading={testWebhook.isStarting}
              loadingPosition="start"
            >
              {t('nodeDetails.webhook.listen')}
            </Button>
          </div>
        )
      )}
    </Paper>
  )
}

export default WebhookUrls
