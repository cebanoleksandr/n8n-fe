import { useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import PushPinIcon from '@mui/icons-material/PushPin'
import { useTranslation } from 'react-i18next'
import CodeEditor from '../code-editor/CodeEditor'
import ItemsJson from '../executions/ItemsJson'
import ItemsView from '../executions/ItemsView'
import type { DataView } from './useDataView'

// The backend's limits (workflows.dto.ts).
const MAX_ITEMS = 1000
const MAX_BYTES = 2 * 1024 * 1024

type Json = Record<string, unknown>

/** Parses what was typed: an object is one item, an array of objects many. */
function parsePinned(text: string): { items: Json[] } | { error: string } {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { error: 'nodeDetails.pin.notJson' }
  }
  const items = Array.isArray(value) ? value : [value]
  if (!items.every((item) => !!item && typeof item === 'object' && !Array.isArray(item))) {
    return { error: 'nodeDetails.pin.notObjects' }
  }
  if (items.length > MAX_ITEMS) return { error: 'nodeDetails.pin.tooMany' }
  if (JSON.stringify(items).length > MAX_BYTES) return { error: 'nodeDetails.pin.tooBig' }
  return { items: items as Json[] }
}

interface EditorProps {
  initial: Json[]
  isSaving: boolean
  onSave: (items: Json[]) => void
  onCancel: () => void
}

/** Pinned data as JSON to edit, checked before it is saved. */
export const PinnedDataEditor: FC<EditorProps> = ({ initial, isSaving, onSave, onCancel }) => {
  const { t } = useTranslation()
  const [text, setText] = useState(() => JSON.stringify(initial, null, 2))
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    const parsed = parsePinned(text)
    if ('error' in parsed) setError(parsed.error)
    else onSave(parsed.items)
  }

  return (
    <div className="flex flex-col gap-3">
      <Typography variant="body2" color="text.secondary">
        {t('nodeDetails.pin.editHint')}
      </Typography>
      <CodeEditor
        value={text}
        onChange={(next) => {
          setText(next)
          setError(null)
        }}
        language="json"
        code
        minRows={10}
        error={!!error}
        helperText={error ? t(error) : undefined}
      />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} disabled={isSaving}>
          {t('common.cancel')}
        </Button>
        <Button variant="contained" onClick={save} loading={isSaving}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}

interface ViewProps {
  items: Json[]
  view: DataView
  canEdit: boolean
  isSaving: boolean
  onEdit: () => void
  onUnpin: () => void
}

/** The pinned output: what test runs use instead of running the node. */
export const PinnedDataView: FC<ViewProps> = ({ items, view, canEdit, isSaving, onEdit, onUnpin }) => {
  const { t } = useTranslation()
  const stored = items.map((json) => ({ json }))

  return (
    <div className="flex flex-col gap-3">
      {/* Buttons under the text: beside it they squeeze it in the narrow column. */}
      <Alert severity="info" icon={<PushPinIcon fontSize="small" />}>
        {t('nodeDetails.pin.pinnedHint')}
        {canEdit && (
          <div className="flex gap-1 mt-1 -ml-1">
            <Button size="small" color="inherit" onClick={onEdit}>
              {t('nodeDetails.pin.edit')}
            </Button>
            <Button size="small" color="inherit" onClick={onUnpin} loading={isSaving}>
              {t('nodeDetails.pin.unpin')}
            </Button>
          </div>
        )}
      </Alert>
      {view === 'json' ? <ItemsJson items={stored} /> : <ItemsView items={stored} />}
    </div>
  )
}
