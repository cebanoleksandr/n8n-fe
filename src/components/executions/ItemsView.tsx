import type { FC } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import { useTranslation } from 'react-i18next'
import type { StoredItem } from '../../api/types'
import { useDownloadBinaryData } from '../../hooks/api'
import { fonts } from '../../theme'

// Rendering thousands of items would freeze the page; n8n pages them too.
const MAX_ITEMS = 50

/** Type marker in front of a field, like n8n's schema view. */
function typeMark(value: unknown) {
  if (value === null) return '∅'
  if (Array.isArray(value)) return '[ ]'
  switch (typeof value) {
    case 'string':
      return 'T'
    case 'number':
      return '#'
    case 'boolean':
      return '◐'
    case 'object':
      return '{ }'
    default:
      return '?'
  }
}

function formatValue(value: unknown) {
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

const ItemFields: FC<{ item: StoredItem }> = ({ item }) => {
  const download = useDownloadBinaryData()
  const entries = Object.entries(item.json)

  return (
    <div className="flex flex-col gap-1">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-start gap-2 min-w-0">
          <Box
            className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded"
            sx={{ border: 1, borderColor: 'divider', fontSize: 12 }}
          >
            <Box component="span" sx={{ color: 'text.secondary', fontFamily: fonts.mono, fontSize: 11 }}>
              {typeMark(value)}
            </Box>
            {key}
          </Box>
          <Typography
            variant="body2"
            component="pre"
            className="min-w-0 m-0 whitespace-pre-wrap break-all"
            sx={{
              fontFamily: typeof value === 'string' ? undefined : fonts.mono,
              fontSize: 13,
              pt: 0.25,
            }}
          >
            {formatValue(value)}
          </Typography>
        </div>
      ))}
      {entries.length === 0 && !item.binary && (
        <Typography variant="body2" color="text.secondary">
          {'{}'}
        </Typography>
      )}
      {item.binary &&
        Object.entries(item.binary).map(([key, file]) => (
          <div key={key}>
            <Chip
              size="small"
              icon={<AttachFileIcon />}
              label={`${key}: ${file.fileName ?? file.mimeType}`}
              onClick={() => download.mutate({ id: file.id, fileName: file.fileName })}
            />
          </div>
        ))}
    </div>
  )
}

/** Items of one input or output, field by field. */
const ItemsView: FC<{ items: StoredItem[] }> = ({ items }) => {
  const { t } = useTranslation()

  if (items.length === 0) {
    return (
      <Typography color="text.secondary" className="text-center py-8">
        {t('executions.logs.noItems')}
      </Typography>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.slice(0, MAX_ITEMS).map((item, index) => (
        <div key={index} className="flex flex-col gap-1">
          {items.length > 1 && (
            <Typography variant="caption" color="text.secondary">
              {t('executions.logs.item', { index: index + 1 })}
            </Typography>
          )}
          <ItemFields item={item} />
        </div>
      ))}
      {items.length > MAX_ITEMS && (
        <Typography variant="caption" color="text.secondary">
          {t('executions.logs.moreItems', { count: items.length - MAX_ITEMS })}
        </Typography>
      )}
    </div>
  )
}

export default ItemsView
