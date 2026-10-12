import { useState } from 'react'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField, { type TextFieldProps } from '@mui/material/TextField'
import Visibility from '@mui/icons-material/Visibility'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import { useTranslation } from 'react-i18next'
import {
  type Control,
  Controller,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'

type Props<T extends FieldValues> = Omit<TextFieldProps, 'name'> & {
  name: FieldPath<T>
  control: Control<T>
}

/**
 * MUI TextField bound to react-hook-form; password fields get a show/hide toggle.
 * Validation messages are translation keys.
 */
const FormTextField = <T extends FieldValues>({
  name,
  control,
  type,
  helperText,
  ...props
}: Props<T>) => {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { ref, ...field }, fieldState: { error } }) => (
        <TextField
          {...props}
          {...field}
          value={field.value ?? ''}
          inputRef={ref}
          type={isPassword && showPassword ? 'text' : type}
          error={!!error}
          helperText={error?.message ? t(error.message) : helperText}
          fullWidth
          slotProps={
            isPassword
              ? {
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={t(showPassword ? 'common.hidePassword' : 'common.showPassword')}
                          onClick={() => setShowPassword((v) => !v)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }
              : props.slotProps
          }
        />
      )}
    />
  )
}

export default FormTextField
