import type { DragEvent, FC } from 'react'
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
// Deeper objects are shown as JSON.
const MAX_DEPTH = 4

/** Turns a field path (".user.email") into the text dropped into a parameter. */
export type DragExpression = (path: string) => string

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** ".email", or ["first name"] for keys that aren't identifiers. */
function pathSegment(key: string) {
  return /^[A-Za-z_$][\w$]*$/.test(key) ? `.${key}` : `[${JSON.stringify(key)}]`
}

interface FieldsProps {
  value: Record<string, unknown>
  path: string
  depth: number
  dragExpression?: DragExpression
}

const Fields: FC<FieldsProps> = ({ value, path, depth, dragExpression }) => {
  const { t } = useTranslation()

  return (
    <>
      {Object.entries(value).map(([key, field]) => {
        const fieldPath = path + pathSegment(key)
        const nested = isPlainObject(field) && depth < MAX_DEPTH && Object.keys(field).length > 0
        const onDragStart = (e: DragEvent) => {
          e.dataTransfer.setData('text/plain', dragExpression!(fieldPath))
          e.dataTransfer.effectAllowed = 'copy'
        }

        return (
          <div key={key} className="flex flex-col gap-1 min-w-0">
            <div className="flex items-start gap-2 min-w-0">
              <Box
                draggable={!!dragExpression}
                onDragStart={dragExpression ? onDragStart : undefined}
                title={dragExpression ? t('nodeDetails.dragHint') : undefined}
                className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded"
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  fontSize: 12,
                  cursor: dragExpression ? 'grab' : 'default',
                  '&:hover': dragExpression ? { borderColor: 'primary.main' } : undefined,
                }}
              >
                <Box component="span" sx={{ color: 'text.secondary', fontFamily: fonts.mono, fontSize: 11 }}>
                  {typeMark(field)}
                </Box>
                {key}
              </Box>
              {!nested && (
                <Typography
                  variant="body2"
                  component="pre"
                  className="min-w-0 m-0 whitespace-pre-wrap break-all"
                  sx={{
                    fontFamily: typeof field === 'string' ? undefined : fonts.mono,
                    fontSize: 13,
                    pt: 0.25,
                  }}
                >
                  {formatValue(field)}
                </Typography>
              )}
            </div>
            {nested && (
              <Box className="flex flex-col gap-1 pl-4" sx={{ borderLeft: 1, borderColor: 'divider', ml: 1 }}>
                <Fields value={field} path={fieldPath} depth={depth + 1} dragExpression={dragExpression} />
              </Box>
            )}
          </div>
        )
      })}
    </>
  )
}

const ItemFields: FC<{ item: StoredItem; dragExpression?: DragExpression }> = ({ item, dragExpression }) => {
  const download = useDownloadBinaryData()
  const empty = Object.keys(item.json).length === 0

  return (
    <div className="flex flex-col gap-1">
      <Fields value={item.json} path="" depth={0} dragExpression={dragExpression} />
      {empty && !item.binary && (
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

interface IProps {
  items: StoredItem[]
  /** Makes fields draggable into parameters (the node settings' input). */
  dragExpression?: DragExpression
}

/** Items of one input or output, field by field. */
const ItemsView: FC<IProps> = ({ items, dragExpression }) => {
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
          <ItemFields item={item} dragExpression={dragExpression} />
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
