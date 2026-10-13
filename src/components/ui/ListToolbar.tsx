import { useEffect, useState, type FC } from 'react'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import { LIST_SORTS, type ListSort, SORT_LABELS } from '../../utils/sorting'

const SEARCH_DELAY_MS = 300

interface IProps {
  search: string
  sort: ListSort
  /** E.g. "Search workflows…". */
  searchPlaceholder: string
  onSearchChange: (search: string) => void
  onSortChange: (sort: ListSort) => void
}

/** Search and sort above a list, as in n8n's overview tabs. */
const ListToolbar: FC<IProps> = ({
  search,
  sort,
  searchPlaceholder,
  onSearchChange,
  onSortChange,
}) => {
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
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
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
                  aria-label={t('common.clearSearch')}
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
        onChange={(e) => onSortChange(e.target.value as ListSort)}
        aria-label={t('sort.label')}
        className="w-full sm:w-auto"
      >
        {LIST_SORTS.map((value) => (
          <MenuItem key={value} value={value}>
            {t(SORT_LABELS[value])}
          </MenuItem>
        ))}
      </Select>
    </div>
  )
}

export default ListToolbar
