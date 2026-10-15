import type { FC, ReactNode } from 'react'
import Typography from '@mui/material/Typography'

interface IProps {
  children: ReactNode
  required?: boolean
  error?: boolean
  htmlFor?: string
}

/** Label above a field: node parameters use it for every control alike. */
const FieldLabel: FC<IProps> = ({ children, required, error, htmlFor }) => (
  <Typography
    variant="body2"
    component="label"
    htmlFor={htmlFor}
    color={error ? 'error' : 'text.primary'}
    sx={{ display: 'block', mb: 0.75, fontWeight: 500, fontSize: 13 }}
  >
    {children}
    {required && (
      <Typography component="span" color="error" sx={{ ml: 0.5, fontSize: 'inherit' }}>
        *
      </Typography>
    )}
  </Typography>
)

export default FieldLabel
