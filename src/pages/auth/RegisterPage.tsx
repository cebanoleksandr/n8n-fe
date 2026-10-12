import { yupResolver } from '@hookform/resolvers/yup'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { getErrorStatus } from '../../api/client'
import FormTextField from '../../components/ui/FormTextField'
import { useRegister } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { type RegisterFormValues, registerSchema } from './schemas'

const RegisterPage = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const register = useRegister()

  const { control, handleSubmit, setError } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      workspaceName: '',
    },
  })

  const onSubmit = ({ name, email, password, workspaceName }: RegisterFormValues) => {
    register.mutate(
      // Empty means the backend default: "<name>'s workspace".
      { name, email, password, workspaceName: workspaceName || undefined },
      {
        onSuccess: () => {
          dispatch(setAlertAC({ text: 'auth.register.success', mode: 'success' }))
          navigate('/workflows', { replace: true })
        },
        onError: (error) => {
          if (getErrorStatus(error) === 409) {
            setError('email', { message: 'auth.register.emailTaken' })
          }
        },
      },
    )
  }

  // 409 is shown on the email field instead.
  const formError =
    register.isError && getErrorStatus(register.error) !== 409
      ? apiErrorMessage(register.error, t, { 403: 'auth.register.disabled' })
      : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div>
        <Typography variant="h2">{t('auth.register.title')}</Typography>
        <Typography color="text.secondary">{t('auth.register.subtitle')}</Typography>
      </div>

      {formError && <Alert severity="error">{formError}</Alert>}

      <FormTextField
        control={control}
        name="name"
        label={t('auth.fields.name')}
        autoComplete="name"
        autoFocus
      />
      <FormTextField
        control={control}
        name="email"
        label={t('auth.fields.email')}
        type="email"
        autoComplete="email"
      />
      <FormTextField
        control={control}
        name="password"
        label={t('auth.fields.password')}
        type="password"
        autoComplete="new-password"
        helperText={t('auth.register.passwordHint')}
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={t('auth.fields.confirmPassword')}
        type="password"
        autoComplete="new-password"
      />
      <FormTextField
        control={control}
        name="workspaceName"
        label={t('auth.fields.workspaceName')}
        helperText={t('common.optional')}
      />

      <Button type="submit" variant="contained" size="large" loading={register.isPending}>
        {t('auth.register.submit')}
      </Button>

      <Typography variant="body2" color="text.secondary" className="text-center">
        {t('auth.register.haveAccount')}{' '}
        <Link component={RouterLink} to="/auth/login">
          {t('auth.register.signInLink')}
        </Link>
      </Typography>
    </form>
  )
}

export default RegisterPage
