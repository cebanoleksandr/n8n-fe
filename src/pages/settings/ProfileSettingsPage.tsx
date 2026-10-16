import { yupResolver } from '@hookform/resolvers/yup'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import { useColorScheme } from '@mui/material/styles'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import SettingsBrightnessOutlinedIcon from '@mui/icons-material/SettingsBrightnessOutlined'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { getErrorStatus } from '../../api/client'
import SettingsSection from '../../components/settings/SettingsSection'
import FieldLabel from '../../components/ui/FieldLabel'
import FormTextField from '../../components/ui/FormTextField'
import { useChangePassword, useMe } from '../../hooks/api'
import { languages } from '../../i18n'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { type ChangePasswordFormValues, changePasswordSchema } from './schemas'

// Each language by its own name, so it can be found whatever the current one is.
const LANGUAGE_NAMES: Record<(typeof languages)[number], string> = {
  en: 'English',
  ru: 'Русский',
}

const ChangePasswordForm = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const change = useChangePassword()

  const { control, handleSubmit, reset, setError } = useForm<ChangePasswordFormValues>({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = ({ currentPassword, newPassword }: ChangePasswordFormValues) => {
    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          reset()
          dispatch(setAlertAC({ text: 'settings.profile.passwordChanged', mode: 'success' }))
        },
        onError: (error) => {
          if (getErrorStatus(error) === 401) {
            setError('currentPassword', { message: 'settings.profile.wrongPassword' })
          }
        },
      },
    )
  }

  // A wrong current password is shown on its field instead.
  const formError =
    change.isError && getErrorStatus(change.error) !== 401 ? apiErrorMessage(change.error, t) : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3 max-w-sm">
      {formError && <Alert severity="error">{formError}</Alert>}
      <FormTextField
        control={control}
        name="currentPassword"
        label={t('settings.profile.currentPassword')}
        type="password"
        autoComplete="current-password"
        size="small"
      />
      <FormTextField
        control={control}
        name="newPassword"
        label={t('settings.profile.newPassword')}
        type="password"
        autoComplete="new-password"
        helperText={t('auth.register.passwordHint')}
        size="small"
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('auth.fields.confirmPassword')}
        type="password"
        autoComplete="new-password"
        size="small"
      />
      <div>
        <Button type="submit" variant="contained" loading={change.isPending}>
          {t('settings.profile.changePassword')}
        </Button>
      </div>
    </form>
  )
}

const ProfileSettingsPage = () => {
  const { t, i18n } = useTranslation()
  const { data: me } = useMe()
  const { mode, setMode } = useColorScheme()

  return (
    <div className="flex flex-col gap-4">
      <SettingsSection title={t('settings.profile.account')}>
        {me && (
          <div className="flex items-center gap-4">
            <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontWeight: 700 }}>
              {me.name.charAt(0).toUpperCase()}
            </Avatar>
            <div className="min-w-0">
              <Typography sx={{ fontWeight: 600 }} noWrap>
                {me.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {me.email}
              </Typography>
            </div>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        title={t('settings.profile.password')}
        description={t('settings.profile.passwordHint')}
      >
        <ChangePasswordForm />
      </SettingsSection>

      <SettingsSection title={t('settings.profile.preferences')}>
        <div className="flex flex-col gap-4 max-w-sm">
          <div>
            <FieldLabel htmlFor="settings-language">{t('settings.profile.language')}</FieldLabel>
            <TextField
              id="settings-language"
              select
              size="small"
              fullWidth
              value={i18n.resolvedLanguage ?? 'en'}
              // The language detector remembers the choice in localStorage.
              onChange={(e) => void i18n.changeLanguage(e.target.value)}
            >
              {languages.map((language) => (
                <MenuItem key={language} value={language}>
                  {LANGUAGE_NAMES[language]}
                </MenuItem>
              ))}
            </TextField>
          </div>
          <div>
            <FieldLabel>{t('settings.profile.theme')}</FieldLabel>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={mode ?? 'system'}
              // MUI keeps the mode in localStorage and applies it on load.
              onChange={(_, value: 'light' | 'dark' | 'system' | null) => value && setMode(value)}
            >
              <ToggleButton value="light" sx={{ gap: 1, textTransform: 'none' }}>
                <LightModeOutlinedIcon fontSize="small" />
                {t('settings.profile.themeLight')}
              </ToggleButton>
              <ToggleButton value="dark" sx={{ gap: 1, textTransform: 'none' }}>
                <DarkModeOutlinedIcon fontSize="small" />
                {t('settings.profile.themeDark')}
              </ToggleButton>
              <ToggleButton value="system" sx={{ gap: 1, textTransform: 'none' }}>
                <SettingsBrightnessOutlinedIcon fontSize="small" />
                {t('settings.profile.themeSystem')}
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}

export default ProfileSettingsPage
