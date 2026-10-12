import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useLogout } from '../../hooks/api'
import ConfirmPopup from './ConfirmPopup'

interface IProps {
  isVisible: boolean
  onClose: () => void
}

const LogoutPopup: FC<IProps> = ({ isVisible, onClose }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const logout = useLogout()

  const handleConfirm = () => {
    // Settled, not success: the local session is cleared even if the request fails.
    logout.mutate(undefined, {
      onSettled: () => {
        onClose()
        navigate('/auth/login', { replace: true })
      },
    })
  }

  return (
    <ConfirmPopup
      isVisible={isVisible}
      onClose={onClose}
      onConfirm={handleConfirm}
      title={t('auth.logout.title')}
      text={t('auth.logout.text')}
      confirmLabel={t('auth.logout.confirm')}
      loading={logout.isPending}
    />
  )
}

export default LogoutPopup
