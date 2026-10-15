import { useState, type FC } from 'react'
import InputBase from '@mui/material/InputBase'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { Workflow } from '../../api/types'
import { useUpdateWorkflow } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'

interface IProps {
  workflow: Workflow
  canEdit: boolean
}

/** The workflow name in the header; click to rename, Enter saves, Esc cancels. */
const WorkflowNameField: FC<IProps> = ({ workflow, canEdit }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const update = useUpdateWorkflow()
  const [editing, setEditing] = useState<string | null>(null)

  const commit = () => {
    const name = editing?.trim() ?? ''
    setEditing(null)
    if (!name || name === workflow.name) return
    update.mutate(
      { id: workflow.id, input: { name } },
      { onError: () => dispatch(setAlertAC({ text: 'editor.renameFailed', mode: 'error' })) },
    )
  }

  if (editing !== null) {
    return (
      <InputBase
        autoFocus
        value={editing}
        onChange={(e) => setEditing(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(null)
        }}
        onFocus={(e) => e.target.select()}
        inputProps={{ maxLength: 128, 'aria-label': t('editor.name') }}
        sx={{ px: 0.5, border: 1, borderColor: 'primary.main', borderRadius: 1, fontSize: 'inherit' }}
      />
    )
  }

  return (
    <Typography
      color="text.primary"
      noWrap
      onClick={canEdit ? () => setEditing(workflow.name) : undefined}
      title={canEdit ? t('editor.rename') : undefined}
      sx={{
        px: 0.5,
        borderRadius: 1,
        border: 1,
        borderColor: 'transparent',
        cursor: canEdit ? 'text' : 'default',
        '&:hover': canEdit ? { borderColor: 'divider' } : undefined,
        // While a rename is saving, show the new name dimmed.
        opacity: update.isPending ? 0.6 : 1,
      }}
    >
      {update.isPending ? update.variables.input.name : workflow.name}
    </Typography>
  )
}

export default WorkflowNameField
