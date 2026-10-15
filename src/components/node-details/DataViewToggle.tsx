import type { FC } from 'react'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { useTranslation } from 'react-i18next'
import type { DataView } from './useDataView'

const DataViewToggle: FC<{ value: DataView; onChange: (view: DataView) => void }> = ({ value, onChange }) => {
  const { t } = useTranslation()
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={value}
      onChange={(_, next: DataView | null) => next && onChange(next)}
      sx={{ '& .MuiToggleButton-root': { py: 0.125, px: 1, fontSize: 12, textTransform: 'none' } }}
    >
      <ToggleButton value="fields">{t('nodeDetails.view.fields')}</ToggleButton>
      <ToggleButton value="json">JSON</ToggleButton>
    </ToggleButtonGroup>
  )
}

export default DataViewToggle
