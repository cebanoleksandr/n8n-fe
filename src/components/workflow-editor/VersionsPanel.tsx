import type { FC } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import ListItemButton from '@mui/material/ListItemButton'
import Skeleton from '@mui/material/Skeleton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import { useTranslation } from 'react-i18next'
import { useWorkflowVersions } from '../../hooks/api'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { formatDateTime, formatRelative } from '../../utils/formatDate'

interface IProps {
  workflowId: string
  /** The workflow's current version number. */
  currentVersion: number | undefined
  /** The version shown on the canvas; null: the current one, being edited. */
  previewId: string | null
  onPreview: (versionId: string | null) => void
  onClose: () => void
}

/** The workflow's versions, newest first: pick one to look at it. */
const VersionsPanel: FC<IProps> = ({ workflowId, currentVersion, previewId, onPreview, onClose }) => {
  const { t, i18n } = useTranslation()
  const versions = useWorkflowVersions(workflowId)

  return (
    <Box
      component="aside"
      // Phones: a sheet over the lower half, the version stays visible above.
      className="absolute inset-x-0 bottom-0 h-1/2 z-10 shadow-lg md:static md:h-auto md:shadow-none md:w-80
                 shrink-0 flex flex-col min-h-0"
      sx={{ borderLeft: { md: 1 }, borderTop: { xs: 1, md: 0 }, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <div className="flex items-start gap-2 px-4 pt-4 pb-2">
        <div className="flex-1">
          <Typography variant="h4">{t('editor.versions.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('editor.versions.subtitle')}
          </Typography>
        </div>
        <IconButton size="small" onClick={onClose} aria-label={t('common.close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-2 pb-3 flex flex-col gap-1">
        {versions.isPending &&
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} variant="rounded" height={52} />)}
        {versions.isError && <Alert severity="error">{apiErrorMessage(versions.error, t)}</Alert>}

        {versions.data?.map((version) => {
          const isCurrent = version.version === currentVersion
          const selected = isCurrent ? previewId === null : previewId === version.id
          return (
            <ListItemButton
              key={version.id}
              selected={selected}
              // The current version is the one being edited.
              onClick={() => onPreview(isCurrent ? null : version.id)}
              sx={{ flexGrow: 0, borderRadius: 1, gap: 1.5, py: 1 }}
            >
              <div className="min-w-0 flex-1">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('executions.version', { version: version.version })}
                </Typography>
                <Tooltip title={formatDateTime(version.createdAt, i18n.language)} placement="left">
                  <Typography variant="caption" color="text.secondary">
                    {formatRelative(version.createdAt, i18n.language)}
                  </Typography>
                </Tooltip>
              </div>
              {isCurrent && <Chip size="small" color="primary" label={t('editor.versions.current')} />}
            </ListItemButton>
          )
        })}
      </div>
    </Box>
  )
}

export default VersionsPanel
