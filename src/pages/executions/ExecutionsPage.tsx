import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import HistoryIcon from '@mui/icons-material/History'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { EXECUTION_STATUSES, type ExecutionStatus, isFinished } from '../../api/types'
import ExecutionRow from '../../components/executions/ExecutionRow'
import ExecutionsFilter, {
  type ExecutionsFilterValue,
} from '../../components/executions/ExecutionsFilter'
import ListPagination from '../../components/ui/ListPagination'
import { useExecutions, useHasRole } from '../../hooks/api'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useListParams } from '../../hooks/useListParams'

const REFRESH_INTERVAL_MS = 5000

/** Filters from the URL (?status=&workflowId=), dropping unknown statuses. */
function readFilter(params: URLSearchParams): ExecutionsFilterValue {
  const status = params.get('status') as ExecutionStatus
  return {
    status: EXECUTION_STATUSES.includes(status) ? status : undefined,
    workflowId: params.get('workflowId') ?? undefined,
  }
}

/** Ticks every second while `active`, so running times count up. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [active])
  return now
}

const ExecutionsPage = () => {
  const { t } = useTranslation()
  const canEdit = useHasRole('editor')
  const { page, limit, update } = useListParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = readFilter(searchParams)
  const [autoRefresh, setAutoRefresh] = useAutoRefresh()

  const { data, isPending, isError, refetch, isPlaceholderData } = useExecutions(
    { ...filter, limit, offset: (page - 1) * limit },
    // Live events are per workflow only, so the whole list is polled.
    { refetchInterval: autoRefresh ? REFRESH_INTERVAL_MS : false },
  )

  const hasRunning = !!data?.items.some((execution) => !isFinished(execution.status))
  const now = useNow(hasRunning)

  const setFilter = (next: ExecutionsFilterValue) => {
    setSearchParams(
      (params) => {
        for (const key of ['status', 'workflowId'] as const) {
          if (next[key]) params.set(key, next[key])
          else params.delete(key)
        }
        params.delete('page')
        return params
      },
      { replace: true },
    )
  }

  // The URL points past the last page, e.g. after a filter change elsewhere.
  const lastPage = data ? Math.max(1, Math.ceil(data.total / limit)) : page
  useEffect(() => {
    if (data && page > lastPage) update({ page: lastPage })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page, lastPage])

  const isFiltered = !!(filter.status || filter.workflowId)

  const renderContent = () => {
    if (isPending) {
      return (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={44} />
          ))}
        </div>
      )
    }

    if (isError) {
      return (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              {t('common.retry')}
            </Button>
          }
        >
          {t('executions.loadFailed')}
        </Alert>
      )
    }

    if (data.total === 0) {
      return (
        <Paper className="flex flex-col items-center gap-3 text-center px-6 py-16">
          <HistoryIcon color={isFiltered ? 'disabled' : 'primary'} sx={{ fontSize: 48 }} />
          <Typography variant="h3">
            {t(isFiltered ? 'executions.notFound.title' : 'executions.empty.title')}
          </Typography>
          <Typography color="text.secondary" className="max-w-sm">
            {t(isFiltered ? 'executions.notFound.text' : 'executions.empty.text')}
          </Typography>
          {isFiltered && (
            <Button onClick={() => setFilter({})}>{t('executions.filter.reset')}</Button>
          )}
        </Paper>
      )
    }

    return (
      <>
        <TableContainer
          component={Paper}
          sx={{ opacity: isPlaceholderData ? 0.6 : 1, transition: 'opacity 150ms' }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {/* Phones: run time and ID are left out, the row opens them. */}
                <TableCell>{t('executions.columns.workflow')}</TableCell>
                <TableCell>{t('executions.columns.status')}</TableCell>
                <TableCell>{t('executions.columns.started')}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('executions.columns.runTime')}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('executions.columns.id')}</TableCell>
                <TableCell padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {data.items.map((execution) => (
                <ExecutionRow
                  key={execution.id}
                  execution={execution}
                  canEdit={canEdit}
                  now={now}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <ListPagination
          total={data.total}
          page={page}
          limit={limit}
          onPageChange={(next) => update({ page: next })}
          onLimitChange={(next) => update({ page: 1, limit: next })}
        />
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <FormControlLabel
          label={t('executions.autoRefresh')}
          control={
            <Checkbox
              size="small"
              checked={autoRefresh}
              onChange={(_, checked) => setAutoRefresh(checked)}
            />
          }
        />
        <ExecutionsFilter value={filter} onChange={setFilter} />
      </div>
      {renderContent()}
    </div>
  )
}

export default ExecutionsPage
