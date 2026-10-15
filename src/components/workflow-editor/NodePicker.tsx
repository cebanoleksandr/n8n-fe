import { useMemo, useState, type FC } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import ListItemButton from '@mui/material/ListItemButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import type { NodeGroup, NodeTypeDescription } from '../../api/types'
import { nodeIcon } from '../workflow-canvas/nodeIcons'

const GROUP_ORDER: NodeGroup[] = ['action', 'transform', 'flow', 'trigger']

interface IProps {
  nodeTypes: NodeTypeDescription[]
  /** No trigger yet: offer only triggers, as n8n does for the first step. */
  triggersOnly: boolean
  onPick: (description: NodeTypeDescription) => void
  onClose: () => void
}

/** The right-hand panel listing node types to add. */
const NodePicker: FC<IProps> = ({ nodeTypes, triggersOnly, onPick, onClose }) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matching = nodeTypes.filter(
      (type) =>
        (!triggersOnly || type.group === 'trigger') &&
        (type.displayName.toLowerCase().includes(query) ||
          type.description.toLowerCase().includes(query)),
    )
    return GROUP_ORDER.map((group) => ({
      group,
      types: matching
        .filter((type) => type.group === group)
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    })).filter(({ types }) => types.length > 0)
  }, [nodeTypes, triggersOnly, search])

  return (
    <Box
      component="aside"
      className="w-96 shrink-0 flex flex-col min-h-0"
      sx={{ borderLeft: 1, borderColor: 'divider', bgcolor: 'background.paper' }}
    >
      <div className="flex items-start gap-2 px-4 pt-4">
        <div className="flex-1">
          <Typography variant="h4">
            {t(triggersOnly ? 'editor.picker.triggerTitle' : 'editor.picker.nextTitle')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(triggersOnly ? 'editor.picker.triggerSubtitle' : 'editor.picker.nextSubtitle')}
          </Typography>
        </div>
        <IconButton size="small" onClick={onClose} aria-label={t('common.close')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="px-4 py-3">
        <TextField
          size="small"
          fullWidth
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('editor.picker.search')}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-auto pb-4">
        {groups.map(({ group, types }) => (
          <div key={group}>
            {!triggersOnly && (
              <Typography variant="overline" color="text.secondary" className="block px-4 pt-2">
                {t(`editor.groups.${group}`)}
              </Typography>
            )}
            {types.map((type) => (
              <ListItemButton
                key={`${type.type}@${type.version}`}
                onClick={() => onPick(type)}
                sx={{
                  gap: 2,
                  px: 2,
                  py: 1.25,
                  alignItems: 'flex-start',
                  flexGrow: 0,
                  borderLeft: 2,
                  borderColor: 'transparent',
                  '&:hover': { borderColor: 'primary.main' },
                  '& svg': { fontSize: 22 },
                }}
              >
                <Box sx={{ color: 'text.secondary', mt: 0.25, display: 'flex' }}>{nodeIcon(type.type)}</Box>
                <div className="min-w-0">
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {type.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {type.description}
                  </Typography>
                </div>
              </ListItemButton>
            ))}
          </div>
        ))}
        {groups.length === 0 && (
          <Typography color="text.secondary" className="text-center py-8 px-4">
            {t('editor.picker.noResults')}
          </Typography>
        )}
      </div>
    </Box>
  )
}

export default NodePicker
