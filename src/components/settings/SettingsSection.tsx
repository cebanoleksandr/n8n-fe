import type { FC, ReactNode } from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'

interface IProps {
  title: ReactNode
  description?: ReactNode
  /** E.g. a button on the right of the title. */
  action?: ReactNode
  children: ReactNode
  /** Red frame, for destructive actions. */
  danger?: boolean
}

/** One block of a settings page: a title, a short explanation, the controls. */
const SettingsSection: FC<IProps> = ({ title, description, action, children, danger }) => (
  <Paper className="flex flex-col gap-4 p-5" sx={danger ? { borderColor: 'error.main' } : undefined}>
    <div className="flex items-start justify-between gap-4">
      <div>
        <Typography variant="h4" color={danger ? 'error' : undefined}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
      </div>
      {action}
    </div>
    {children}
  </Paper>
)

export default SettingsSection
