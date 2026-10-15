import type { FC } from 'react'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import type { WorkflowNode } from '../../api/types'
import FieldLabel from '../ui/FieldLabel'

interface IProps {
  node: WorkflowNode
  onChange: (patch: Partial<WorkflowNode>) => void
}

// Limits of the backend's graph schema.
const MAX_TRIES = 10
const MAX_WAIT_MS = 300_000

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** How the node runs: on/off, failures, retries. */
const NodeSettings: FC<IProps> = ({ node, onChange }) => {
  const { t } = useTranslation()

  const toggle = (key: 'disabled' | 'continueOnFail' | 'retryOnFail', hint: string) => (
    <div>
      <FormControlLabel
        label={<Typography variant="body2" sx={{ fontWeight: 500 }}>{t(`nodeDetails.settings.${key}`)}</Typography>}
        sx={{ ml: 0, gap: 1 }}
        control={
          <Switch
            size="small"
            checked={!!node[key]}
            // Off is the default: leave it out of the saved graph.
            onChange={(_, checked) => onChange({ [key]: checked || undefined })}
          />
        }
      />
      <FormHelperText>{hint}</FormHelperText>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {toggle('disabled', t('nodeDetails.settings.disabledHint'))}
      {toggle('continueOnFail', t('nodeDetails.settings.continueOnFailHint'))}
      {toggle('retryOnFail', t('nodeDetails.settings.retryOnFailHint'))}

      {node.retryOnFail && (
        <div className="flex gap-3">
          <div className="flex-1">
            <FieldLabel>{t('nodeDetails.settings.maxTries')}</FieldLabel>
            <TextField
              size="small"
              fullWidth
              type="number"
              value={node.maxTries ?? 3}
              onChange={(e) => onChange({ maxTries: clamp(Math.round(Number(e.target.value) || 1), 1, MAX_TRIES) })}
              slotProps={{ htmlInput: { min: 1, max: MAX_TRIES, 'aria-label': t('nodeDetails.settings.maxTries') } }}
            />
          </div>
          <div className="flex-1">
            <FieldLabel>{t('nodeDetails.settings.waitBetweenTries')}</FieldLabel>
            <TextField
              size="small"
              fullWidth
              type="number"
              value={node.waitBetweenTriesMs ?? 1000}
              onChange={(e) =>
                onChange({ waitBetweenTriesMs: clamp(Math.round(Number(e.target.value) || 0), 0, MAX_WAIT_MS) })
              }
              slotProps={{
                htmlInput: { min: 0, max: MAX_WAIT_MS, step: 100, 'aria-label': t('nodeDetails.settings.waitBetweenTries') },
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default NodeSettings
