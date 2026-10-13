import { useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { WORKFLOW_SORTS, type WorkflowSort } from '../../api/types'
import ListPagination from '../../components/ui/ListPagination'
import WorkflowCard from '../../components/workflows/WorkflowCard'
import WorkflowsToolbar from '../../components/workflows/WorkflowsToolbar'
import { useHasRole, useWorkflows } from '../../hooks/api'
import { useCreateWorkflowAndOpen } from '../../hooks/useCreateWorkflowAndOpen'
import { PAGE_SIZES } from '../../utils/pagination'

const DEFAULTS = {
  page: 1,
  limit: 20,
  search: '',
  sort: 'updatedAt:desc' as WorkflowSort,
}

type ListState = typeof DEFAULTS

/** List state from the URL, falling back on anything invalid. */
function readState(params: URLSearchParams): ListState {
  const page = Number(params.get('page'))
  const limit = Number(params.get('limit'))
  const sort = params.get('sort') as WorkflowSort
  return {
    page: Number.isInteger(page) && page > 0 ? page : DEFAULTS.page,
    limit: PAGE_SIZES.includes(limit) ? limit : DEFAULTS.limit,
    search: params.get('search')?.trim() ?? DEFAULTS.search,
    sort: WORKFLOW_SORTS.includes(sort) ? sort : DEFAULTS.sort,
  }
}

const WorkflowsPage = () => {
  const { t } = useTranslation()
  const canEdit = useHasRole('editor')
  const { createAndOpen, isPending: isCreating } = useCreateWorkflowAndOpen()
  const [searchParams, setSearchParams] = useSearchParams()
  const { page, limit, search, sort } = readState(searchParams)

  const { data, isPending, isError, refetch, isPlaceholderData } = useWorkflows({
    limit,
    offset: (page - 1) * limit,
    search: search || undefined,
    sort,
  })

  /** Writes changes to the URL; default values are left out to keep it short. */
  const update = (patch: Partial<ListState>) => {
    setSearchParams(
      (params) => {
        const next = { ...readState(params), ...patch }
        for (const key of Object.keys(DEFAULTS) as (keyof ListState)[]) {
          if (next[key] === DEFAULTS[key]) params.delete(key)
          else params.set(key, String(next[key]))
        }
        return params
      },
      { replace: true },
    )
  }

  // The last item of the last page was deleted, or the URL points past the end.
  const lastPage = data ? Math.max(1, Math.ceil(data.total / limit)) : page
  useEffect(() => {
    if (data && page > lastPage) update({ page: lastPage })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, page, lastPage])

  const renderList = () => {
    if (isPending) {
      return (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={62} />
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
          {t('workflows.loadFailed')}
        </Alert>
      )
    }

    if (data.total === 0 && search) {
      return (
        <Paper className="flex flex-col items-center gap-3 text-center px-6 py-16">
          <SearchOffIcon color="disabled" sx={{ fontSize: 48 }} />
          <Typography variant="h3">{t('workflows.notFound.title')}</Typography>
          <Typography color="text.secondary" className="max-w-sm">
            {t('workflows.notFound.text', { search })}
          </Typography>
          <Button onClick={() => update({ search: '', page: 1 })}>
            {t('workflows.clearSearch')}
          </Button>
        </Paper>
      )
    }

    if (data.total === 0) {
      return (
        <Paper className="flex flex-col items-center gap-3 text-center px-6 py-16">
          <AccountTreeOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography variant="h3">{t('workflows.empty.title')}</Typography>
          <Typography color="text.secondary" className="max-w-sm">
            {t('workflows.empty.text')}
          </Typography>
          {canEdit && (
            <Button variant="contained" onClick={createAndOpen} loading={isCreating}>
              {t('workflows.create')}
            </Button>
          )}
        </Paper>
      )
    }

    return (
      <>
        <div
          className="flex flex-col gap-2"
          style={{ opacity: isPlaceholderData ? 0.6 : 1, transition: 'opacity 150ms' }}
        >
          {data.items.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>

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
      <WorkflowsToolbar
        search={search}
        sort={sort}
        onSearchChange={(next) => update({ search: next, page: 1 })}
        onSortChange={(next) => update({ sort: next, page: 1 })}
      />
      {renderList()}
    </div>
  )
}

export default WorkflowsPage
