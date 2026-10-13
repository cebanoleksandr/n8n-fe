import { useEffect, useState, type FC } from 'react'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import { WORKFLOW_SORTS, type WorkflowSort } from '../../api/types'

const SEARCH_DELAY_MS = 300

// Translation keys can't contain the API values: i18next reads ":" as the
// namespace separator, so 'sort.name:asc' would come out as just "asc".
const SORT_LABELS: Record<WorkflowSort, string> = {
  'updatedAt:desc': 'workflows.sort.updatedDesc',
  'createdAt:desc': 'workflows.sort.createdDesc',
  'name:asc': 'workflows.sort.nameAsc',
  'name:desc': 'workflows.sort.nameDesc',
}

interface IProps {
  search: string
  sort: WorkflowSort
  onSearchChange: (search: string) => void
  onSortChange: (sort: WorkflowSort) => void
}

/** Search and sort above the workflow list. */
const WorkflowsToolbar: FC<IProps> = ({ search, sort, onSearchChange, onSortChange }) => {
  const { t } = useTranslation()
  // Typed text; the list is asked only once the user pauses.
  const [text, setText] = useState(search)

  // Back/forward or "clear search" elsewhere changed the URL. Our own debounced
  // update matches the text already, so typing (e.g. a trailing space) is kept.
  const [prevSearch, setPrevSearch] = useState(search)
  if (search !== prevSearch) {
    setPrevSearch(search)
    if (search !== text.trim()) setText(search)
  }

  useEffect(() => {
    if (text.trim() === search) return
    const timer = setTimeout(() => onSearchChange(text.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  return (
    <div className="flex items-center justify-end gap-2 flex-wrap">
      <TextField
        size="small"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t('workflows.search')}
        aria-label={t('workflows.search')}
        className="w-full sm:w-64"
        slotProps={{
          htmlInput: { maxLength: 128 },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: text && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  edge="end"
                  aria-label={t('workflows.clearSearch')}
                  onClick={() => {
                    setText('')
                    onSearchChange('')
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <Select
        size="small"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as WorkflowSort)}
        aria-label={t('workflows.sort.label')}
        className="w-full sm:w-auto"
      >
        {WORKFLOW_SORTS.map((value) => (
          <MenuItem key={value} value={value}>
            {t(SORT_LABELS[value])}
          </MenuItem>
        ))}
      </Select>
    </div>
  )
}

export default WorkflowsToolbar
