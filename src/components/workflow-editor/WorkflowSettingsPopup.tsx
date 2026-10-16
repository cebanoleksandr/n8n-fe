import { useId, useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import type { Workflow } from '../../api/types'
import { useCreateWorkflow, useUpdateWorkflow, useWorkflow, useWorkflows } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import BasePopup from '../popups/BasePopup'
import FieldLabel from '../ui/FieldLabel'

const UNITS = { seconds: 1, minutes: 60, hours: 3600 } as const
type Unit = keyof typeof UNITS

/** The largest unit the timeout divides into evenly: 7200 s reads "2 hours". */
function splitTimeout(seconds: number): { amount: number; unit: Unit } {
  if (seconds % 3600 === 0) return { amount: seconds / 3600, unit: 'hours' }
  if (seconds % 60 === 0) return { amount: seconds / 60, unit: 'minutes' }
  return { amount: seconds, unit: 'seconds' }
}

interface Option {
  id: string
  name: string
}

interface IProps {
  workflow: Workflow
  canEdit: boolean
  onClose: () => void
}

/** Timeout and error workflow; opened from the workflow's "…" menu. */
const WorkflowSettingsPopup: FC<IProps> = ({ workflow, canEdit, onClose }) => {
  const { t } = useTranslation()
  const titleId = useId()
  const dispatch = useAppDispatch()
  const update = useUpdateWorkflow()
  const create = useCreateWorkflow()

  const [errorWorkflowId, setErrorWorkflowId] = useState<string | null>(
    workflow.settings.errorWorkflowId ?? null,
  )
  const initialTimeout = workflow.settings.timeoutSeconds
  const [limitTime, setLimitTime] = useState(!!initialTimeout)
  const [amount, setAmount] = useState(String(initialTimeout ? splitTimeout(initialTimeout).amount : 5))
  const [unit, setUnit] = useState<Unit>(initialTimeout ? splitTimeout(initialTimeout).unit : 'minutes')

  // Options come from the API's search; this workflow can't handle its own errors.
  const [search, setSearch] = useState('')
  const workflows = useWorkflows({ search: search.trim() || undefined, sort: 'name:asc', limit: 20 })
  const options: Option[] = (workflows.data?.items ?? []).filter((item) => item.id !== workflow.id)
  // The chosen one may not be among the loaded options.
  const selected = useWorkflow(errorWorkflowId ?? undefined)
  const value: Option | null = selected.data ? { id: selected.data.id, name: selected.data.name } : null

  const timeoutSeconds = Number(amount) * UNITS[unit]
  const timeoutValid = !limitTime || (Number.isInteger(Number(amount)) && Number(amount) >= 1)

  /** A workflow with just an Error Trigger, ready to get its notification steps. */
  const createErrorWorkflow = () => {
    create.mutate(
      {
        name: t('workflowSettings.errorWorkflowName', { name: workflow.name }),
        graph: {
          nodes: [
            {
              id: crypto.randomUUID(),
              name: 'Error Trigger',
              type: 'core.errorTrigger',
              typeVersion: 1,
              position: [0, 0],
              parameters: {},
            },
          ],
          connections: [],
        },
      },
      {
        onSuccess: (created) => {
          setErrorWorkflowId(created.id)
          dispatch(setAlertAC({ text: 'workflowSettings.errorWorkflowCreated', mode: 'success' }))
        },
        onError: (error) => dispatch(setAlertAC({ text: apiErrorMessage(error, t), mode: 'error' })),
      },
    )
  }

  const save = () => {
    update.mutate(
      {
        id: workflow.id,
        input: {
          settings: {
            // null clears a setting.
            errorWorkflowId,
            timeoutSeconds: limitTime ? timeoutSeconds : null,
          },
        },
      },
      {
        onSuccess: () => {
          dispatch(setAlertAC({ text: 'workflowSettings.saved', mode: 'success' }))
          onClose()
        },
      },
    )
  }

  return (
    <BasePopup isVisible onClose={onClose} labelledBy={titleId} style={{ width: 560, maxWidth: '92vw', padding: 24 }}>
      <div className="flex flex-col gap-5">
        <Typography id={titleId} variant="h3">
          {t('workflowSettings.title')}
        </Typography>

        {update.isError && <Alert severity="error">{apiErrorMessage(update.error, t)}</Alert>}

        <div>
          <FieldLabel>{t('workflowSettings.errorWorkflow')}</FieldLabel>
          <div className="flex items-start gap-2">
            <Autocomplete<Option>
              className="flex-1"
              size="small"
              disabled={!canEdit}
              options={options}
              value={value}
              onChange={(_, option) => setErrorWorkflowId(option?.id ?? null)}
              onInputChange={(_, text, reason) => {
                if (reason === 'input') setSearch(text)
              }}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, current) => option.id === current.id}
              // The API already filters by the typed text.
              filterOptions={(list) => list}
              loading={workflows.isFetching}
              noOptionsText={t('executions.filter.noWorkflows')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={t('workflowSettings.none')}
                  slotProps={{
                    ...params.slotProps,
                    htmlInput: { ...params.slotProps.htmlInput, 'aria-label': t('workflowSettings.errorWorkflow') },
                  }}
                />
              )}
            />
            {canEdit && (
              <Button
                startIcon={<AddIcon />}
                onClick={createErrorWorkflow}
                loading={create.isPending}
                sx={{ whiteSpace: 'nowrap', height: 37 }}
              >
                {t('workflowSettings.createErrorWorkflow')}
              </Button>
            )}
          </div>
          <FormHelperText>{t('workflowSettings.errorWorkflowHint')}</FormHelperText>
        </div>

        <div>
          <FormControlLabel
            label={<Typography variant="body2" sx={{ fontWeight: 500 }}>{t('workflowSettings.limitTime')}</Typography>}
            sx={{ ml: 0, gap: 1 }}
            control={
              <Switch
                size="small"
                disabled={!canEdit}
                checked={limitTime}
                onChange={(_, checked) => setLimitTime(checked)}
              />
            }
          />
          {limitTime && (
            <div className="flex items-start gap-2 mt-2">
              <TextField
                size="small"
                type="number"
                disabled={!canEdit}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                error={!timeoutValid}
                slotProps={{ htmlInput: { min: 1, 'aria-label': t('workflowSettings.timeout') } }}
                sx={{ width: 120 }}
              />
              <TextField
                select
                size="small"
                disabled={!canEdit}
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                slotProps={{ htmlInput: { 'aria-label': t('workflowSettings.unit') } }}
                sx={{ width: 140 }}
              >
                {(Object.keys(UNITS) as Unit[]).map((key) => (
                  <MenuItem key={key} value={key}>
                    {t(`workflowSettings.units.${key}`)}
                  </MenuItem>
                ))}
              </TextField>
            </div>
          )}
          <FormHelperText>{t('workflowSettings.timeoutHint')}</FormHelperText>
        </div>

        <div className="flex justify-end gap-2">
          <Button onClick={onClose} disabled={update.isPending}>
            {t(canEdit ? 'common.cancel' : 'common.close')}
          </Button>
          {canEdit && (
            <Button variant="contained" onClick={save} disabled={!timeoutValid} loading={update.isPending}>
              {t('common.save')}
            </Button>
          )}
        </div>
      </div>
    </BasePopup>
  )
}

export default WorkflowSettingsPopup
