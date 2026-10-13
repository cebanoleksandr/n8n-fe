import type { FC } from 'react'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormHelperText from '@mui/material/FormHelperText'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import { useTranslation } from 'react-i18next'
import { type Control, Controller, type FieldPath } from 'react-hook-form'
import type { PropertySchema } from '../../api/types'
import { fonts } from '../../theme'
import FormTextField from '../ui/FormTextField'
import type { CredentialFormValues } from './credentialForm'

interface IProps {
  property: PropertySchema
  control: Control<CredentialFormValues>
  /** Editing: a secret left empty keeps the saved value. */
  isEdit: boolean
}

/** One field of a credential type, picked by its property type. */
const CredentialField: FC<IProps> = ({ property, control, isEdit }) => {
  const { t } = useTranslation()
  const name = `data.${property.name}` as FieldPath<CredentialFormValues>
  const label = property.displayName
  const required = property.required && !(isEdit && property.secret)

  if (property.type === 'boolean') {
    return (
      <div>
        <Controller
          name={name}
          control={control}
          render={({ field: { value, onChange, ref } }) => (
            <FormControlLabel
              label={label}
              control={
                <Switch
                  checked={!!value}
                  onChange={(_, checked) => onChange(checked)}
                  slotProps={{ input: { ref } }}
                />
              }
            />
          )}
        />
        {property.description && <FormHelperText>{property.description}</FormHelperText>}
      </div>
    )
  }

  if (property.type === 'options') {
    return (
      <FormTextField
        control={control}
        name={name}
        label={label}
        required={required}
        helperText={property.description}
        select
      >
        {property.options?.map((option) => (
          <MenuItem key={String(option.value)} value={option.value as string}>
            {option.name}
          </MenuItem>
        ))}
      </FormTextField>
    )
  }

  const multiline = property.type === 'json' || property.type === 'code' || property.type === 'list'

  return (
    <FormTextField
      control={control}
      name={name}
      label={label}
      required={required}
      type={property.secret ? 'password' : property.type === 'number' ? 'number' : 'text'}
      // Browsers would offer the user's own login for an API key field.
      autoComplete={property.secret ? 'new-password' : 'off'}
      placeholder={
        isEdit && property.secret ? t('credentials.secretKept') : property.placeholder
      }
      helperText={property.description}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      slotProps={
        multiline ? { htmlInput: { style: { fontFamily: fonts.mono } } } : undefined
      }
    />
  )
}

export default CredentialField
