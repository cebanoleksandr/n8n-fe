import { useState } from 'react'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined'
import { useTranslation } from 'react-i18next'
import { useCreateWorkflowAndOpen } from '../../hooks/useCreateWorkflowAndOpen'
import { useImportWorkflowFromFile } from '../../hooks/useImportWorkflowFromFile'

/** "Create workflow", with "Import from file" behind the arrow, as in n8n. */
const CreateWorkflowButton = () => {
  const { t } = useTranslation()
  const { createAndOpen, isPending } = useCreateWorkflowAndOpen()
  const importer = useImportWorkflowFromFile()
  // The menu opens under the whole button group.
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <ButtonGroup variant="contained" disableElevation>
        <Button onClick={createAndOpen} loading={isPending || importer.isPending}>
          {t('workflows.create')}
        </Button>
        <Button
          size="small"
          aria-label={t('workflows.import.more')}
          aria-haspopup="menu"
          onClick={(e) => setAnchor(e.currentTarget.parentElement)}
          sx={{ px: 0.5, minWidth: 0 }}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Menu
        anchorEl={anchor}
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setAnchor(null)
            importer.pickFile()
          }}
        >
          <ListItemIcon>
            <FileUploadOutlinedIcon fontSize="small" />
          </ListItemIcon>
          {t('workflows.import.fromFile')}
        </MenuItem>
      </Menu>
    </>
  )
}

export default CreateWorkflowButton
