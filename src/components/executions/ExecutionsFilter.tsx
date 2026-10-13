import { useState, type FC } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import { useTranslation } from 'react-i18next'
import { EXECUTION_STATUSES, type ExecutionStatus } from '../../api/types'
import { useWorkflow, useWorkflows } from '../../hooks/api'

export interface ExecutionsFilterValue {
  status?: ExecutionStatus
  workflowId?: string
}

interface IProps {
  value: ExecutionsFilterValue
  onChange: (value: ExecutionsFilterValue) => void
  /** Off inside one workflow's executions. */
  showWorkflow?: boolean
}

interface WorkflowOption {
  id: string
  name: string
}

/** The filter button and its popover: status and workflow. */
const ExecutionsFilter: FC<IProps> = ({ value, onChange, showWorkflow = true }) => {
  const { t } = useTranslation()
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const [workflowSearch, setWorkflowSearch] = useState('')

  // Options come from the API's search, so any workflow can be picked.
  const workflows = useWorkflows(
    { search: workflowSearch.trim() || undefined, sort: 'name:asc', limit: 20 },
    { enabled: showWorkflow },
  )
  // The chosen workflow may not be among the loaded options.
  const selected = useWorkflow(showWorkflow ? value.workflowId : undefined)
  const selectedOption: WorkflowOption | null = selected.data
    ? { id: selected.data.id, name: selected.data.name }
    : null

  const activeCount = Number(!!value.status) + Number(!!value.workflowId)

  return (
    <>
      <Tooltip title={t('executions.filter.title')}>
        <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label={t('executions.filter.title')}>
          <Badge color="primary" badgeContent={activeCount} invisible={!activeCount}>
            <FilterAltOutlinedIcon fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <div className="flex flex-col gap-3 p-4 w-80">
          <TextField
            select
            size="small"
            label={t('executions.filter.status')}
            value={value.status ?? ''}
            onChange={(e) =>
              onChange({ ...value, status: (e.target.value || undefined) as ExecutionStatus })
            }
          >
            <MenuItem value="">{t('executions.filter.any')}</MenuItem>
            {EXECUTION_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {t(`executions.status.${status}`)}
              </MenuItem>
            ))}
          </TextField>

          {showWorkflow && (
          <Autocomplete<WorkflowOption>
            size="small"
            options={workflows.data?.items ?? []}
            value={selectedOption}
            onChange={(_, option) => onChange({ ...value, workflowId: option?.id })}
            onInputChange={(_, text, reason) => {
              if (reason === 'input') setWorkflowSearch(text)
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, current) => option.id === current.id}
            // The API already filters by the typed text.
            filterOptions={(options) => options}
            loading={workflows.isFetching}
            noOptionsText={t('executions.filter.noWorkflows')}
            renderInput={(params) => (
              <TextField {...params} label={t('executions.filter.workflow')} placeholder={t('executions.filter.any')} />
            )}
          />
          )}

          <div className="flex justify-end">
            <Button size="small" disabled={!activeCount} onClick={() => onChange({})}>
              {t('executions.filter.reset')}
            </Button>
          </div>
        </div>
      </Popover>
    </>
  )
}

export default ExecutionsFilter
