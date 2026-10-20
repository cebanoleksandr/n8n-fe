import type { FC } from 'react'
import MenuItem from '@mui/material/MenuItem'
import Pagination from '@mui/material/Pagination'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import { PAGE_SIZES } from '../../utils/pagination'

interface IProps {
  total: number
  /** 1-based. */
  page: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

/** "Total 24  ‹ 1 2 ›  20 / page", as under n8n's lists. */
const ListPagination: FC<IProps> = ({ total, page, limit, onPageChange, onLimitChange }) => {
  const { t } = useTranslation()
  const pageCount = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="flex items-center justify-center sm:justify-end gap-x-4 gap-y-2 flex-wrap">
      <Typography variant="body2" color="text.secondary">
        {t('pagination.total', { count: total })}
      </Typography>
      <Pagination
        count={pageCount}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        shape="rounded"
        size="small"
      />
      <Select
        size="small"
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        aria-label={t('pagination.perPageLabel')}
      >
        {PAGE_SIZES.map((size) => (
          <MenuItem key={size} value={size}>
            {t('pagination.perPage', { count: size })}
          </MenuItem>
        ))}
      </Select>
    </div>
  )
}

export default ListPagination
