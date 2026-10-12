import { useId, type FC, type ReactNode } from 'react'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'
import BasePopup from './BasePopup'

interface IProps {
  isVisible: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  text?: ReactNode
  /** Defaults to "Confirm". */
  confirmLabel?: ReactNode
  /** Red confirm button, for destructive actions. */
  danger?: boolean
  /** The confirmed action is running: buttons are locked and closing is ignored. */
  loading?: boolean
}

const ConfirmPopup: FC<IProps> = ({
  isVisible,
  onClose,
  onConfirm,
  title,
  text,
  confirmLabel,
  danger = false,
  loading = false,
}) => {
  const { t } = useTranslation()
  const titleId = useId()
  const textId = useId()

  const handleClose = () => {
    if (!loading) onClose()
  }

  return (
    <BasePopup
      isVisible={isVisible}
      onClose={handleClose}
      labelledBy={titleId}
      describedBy={text ? textId : undefined}
      style={{ padding: 24, maxWidth: 440 }}
    >
      <div className="flex flex-col gap-4">
        <Typography id={titleId} variant="h3">
          {title}
        </Typography>
        {text && (
          <Typography id={textId} color="text.secondary">
            {text}
          </Typography>
        )}
        <div className="flex justify-end gap-2">
          <Button onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            color={danger ? 'error' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </div>
    </BasePopup>
  )
}

export default ConfirmPopup
