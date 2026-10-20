import { useState, type FC } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import ListItemButton from '@mui/material/ListItemButton'
import Skeleton from '@mui/material/Skeleton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { queryKeys } from '../../api/query-keys'
import type { ExecutionStatus } from '../../api/types'
import { useExecutionEvents } from '../../hooks/api'
import { useAutoRefresh } from '../../hooks/useAutoRefresh'
import { useExecutionStatusLine } from '../../hooks/useExecutionStatusLine'
import { executionsService } from '../../services/executions.service'
import { formatDateTime } from '../../utils/formatDate'
import ExecutionsFilter from './ExecutionsFilter'

const PAGE_SIZE = 20

const STATUS_COLOR: Record<ExecutionStatus, string> = {
  queued: 'text.disabled',
  running: 'info.main',
  waiting: 'warning.main',
  success: 'success.main',
  error: 'error.main',
  canceled: 'text.disabled',
}

interface IProps {
  workflowId: string
}

/** A workflow's runs, newest first, as in n8n's executions tab. */
const ExecutionsSidebar: FC<IProps> = ({ workflowId }) => {
  const { t, i18n } = useTranslation()
  const statusLine = useExecutionStatusLine()
  const [autoRefresh, setAutoRefresh] = useAutoRefresh()
  const [status, setStatus] = useState<ExecutionStatus | undefined>()

  // Pages of 20 (the API allows up to 100 per request). The key sits under
  // executions.lists, so live events refresh it like the other lists.
  const { data, isPending, isError, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [...queryKeys.executions.lists, 'sidebar', { workflowId, status }],
      queryFn: ({ pageParam }) =>
        executionsService.list({ workflowId, status, limit: PAGE_SIZE, offset: pageParam }),
      initialPageParam: 0,
      getNextPageParam: (lastPage, pages) => {
        const loaded = pages.reduce((sum, page) => sum + page.items.length, 0)
        return loaded < lastPage.total ? loaded : undefined
      },
      placeholderData: keepPreviousData,
    })
  const items = data?.pages.flatMap((page) => page.items)
  // One workflow's runs have live events: no need to poll.
  useExecutionEvents(autoRefresh ? { workflowId } : null)

  return (
    <Box
      // Phones: the whole screen, the open run replaces it.
      className="h-full md:h-auto w-full md:w-72 shrink-0 flex flex-col min-h-0"
      sx={{ borderRight: { md: 1 }, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <div className="px-4 pt-4 pb-2 flex flex-col gap-1">
        <Typography variant="h4">{t('executions.title')}</Typography>
        <div className="flex items-center justify-between">
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
          <ExecutionsFilter
            value={{ status }}
            onChange={(next) => setStatus(next.status)}
            showWorkflow={false}
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto px-2 pb-2 flex flex-col gap-1">
        {isPending &&
          Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="rounded" height={56} />)}

        {isError && (
          <Typography variant="body2" color="error" className="px-2">
            {t('executions.loadFailed')}
          </Typography>
        )}

        {items?.map((execution) => (
          <ListItemButton
            key={execution.id}
            component={NavLink}
            to={`/workflows/${workflowId}/executions/${execution.id}`}
            sx={{
              flexGrow: 0,
              borderRadius: 1,
              borderLeft: 4,
              borderColor: STATUS_COLOR[execution.status],
              gap: 1,
              py: 1,
              '&.active': { bgcolor: 'action.selected' },
            }}
          >
            <div className="min-w-0 flex-1">
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {formatDateTime(execution.startedAt ?? execution.createdAt, i18n.language)}
              </Typography>
              <Typography
                variant="caption"
                color={execution.status === 'error' ? 'error' : 'text.secondary'}
                noWrap
                component="div"
              >
                {statusLine(execution)}
              </Typography>
            </div>
            {execution.mode === 'manual' && (
              <Tooltip title={t('executions.mode.manual')}>
                <ScienceOutlinedIcon fontSize="small" color="disabled" />
              </Tooltip>
            )}
          </ListItemButton>
        ))}

        {items && items.length === 0 && (
          <Typography variant="body2" color="text.secondary" className="text-center py-8 px-2">
            {t(status ? 'executions.notFound.text' : 'executions.empty.text')}
          </Typography>
        )}

        {hasNextPage && (
          <Button size="small" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            {t('executions.loadMore')}
          </Button>
        )}
      </div>
    </Box>
  )
}

export default ExecutionsSidebar
