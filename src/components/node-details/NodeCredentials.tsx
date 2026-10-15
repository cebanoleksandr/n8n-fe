import { useState, type FC } from 'react'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/Add'
import { useTranslation } from 'react-i18next'
import type { NodeCredentialDescription } from '../../api/types'
import { useCredentials, useCredentialTypes } from '../../hooks/api'
import CredentialPopup from '../credentials/CredentialPopup'
import FieldLabel from '../ui/FieldLabel'

const CREATE = '__create__'

interface FieldProps {
  description: NodeCredentialDescription
  value: string | undefined
  onChange: (credentialId: string | undefined) => void
}

/** One credential slot of a node: pick a saved one, or create it here. */
const CredentialField: FC<FieldProps> = ({ description, value, onChange }) => {
  const { t } = useTranslation()
  const credentials = useCredentials(description.type)
  const types = useCredentialTypes()
  const [isCreating, setIsCreating] = useState(false)

  const typeName =
    types.data?.find((type) => type.type === description.type)?.displayName ?? description.type
  // A deleted credential still referenced by the node.
  const known = !value || credentials.data?.some((credential) => credential.id === value)
  const missing = description.required && !value

  return (
    <div>
      <FieldLabel required={description.required} error={missing || !known}>
        {t('nodeDetails.credentialFor', { type: typeName })}
      </FieldLabel>
      <TextField
        select
        size="small"
        fullWidth
        slotProps={{ htmlInput: { 'aria-label': t('nodeDetails.credentialFor', { type: typeName }) } }}
        value={known ? (value ?? '') : ''}
        onChange={(e) => {
          if (e.target.value === CREATE) setIsCreating(true)
          else onChange(e.target.value || undefined)
        }}
        error={missing || !known}
        helperText={
          !known
            ? t('nodeDetails.credentialMissing')
            : missing
              ? t('nodeDetails.required')
              : undefined
        }
      >
        {!description.required && <MenuItem value="">{t('nodeDetails.none')}</MenuItem>}
        {credentials.data?.map((credential) => (
          <MenuItem key={credential.id} value={credential.id}>
            {credential.name}
          </MenuItem>
        ))}
        {credentials.data?.length ? <Divider /> : null}
        <MenuItem value={CREATE}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          {t('nodeDetails.createCredential')}
        </MenuItem>
      </TextField>

      <CredentialPopup
        isVisible={isCreating}
        onClose={() => setIsCreating(false)}
        initialType={description.type}
        onSaved={(credential) => onChange(credential.id)}
      />
    </div>
  )
}

interface IProps {
  /** The node type's credential slots that apply to its current parameters. */
  descriptions: NodeCredentialDescription[]
  value: Record<string, string> | undefined
  onChange: (credentials: Record<string, string> | undefined) => void
}

/** The credentials a node signs in with, keyed by credential type. */
const NodeCredentials: FC<IProps> = ({ descriptions, value, onChange }) => {
  const set = (type: string, credentialId: string | undefined) => {
    const next = { ...value }
    if (credentialId) next[type] = credentialId
    else delete next[type]
    onChange(Object.keys(next).length ? next : undefined)
  }

  return (
    <div className="flex flex-col gap-4">
      {descriptions.map((description) => (
        <CredentialField
          key={description.type}
          description={description}
          value={value?.[description.type]}
          onChange={(credentialId) => set(description.type, credentialId)}
        />
      ))}
    </div>
  )
}

export default NodeCredentials
