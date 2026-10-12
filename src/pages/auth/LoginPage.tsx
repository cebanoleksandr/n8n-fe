import { yupResolver } from '@hookform/resolvers/yup'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import FormTextField from '../../components/ui/FormTextField'
import { useLogin } from '../../hooks/api'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import { type LoginFormValues, loginSchema } from './schemas'

/** Only same-app paths, so ?redirectTo= can't send the user to another site. */
function safeRedirect(path: string | null) {
  return path?.startsWith('/') && !path.startsWith('//') ? path : '/workflows'
}

const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useLogin()

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = (values: LoginFormValues) => {
    login.mutate(values, {
      onSuccess: () =>
        navigate(safeRedirect(searchParams.get('redirectTo')), { replace: true }),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div>
        <Typography variant="h2">{t('auth.login.title')}</Typography>
        <Typography color="text.secondary">{t('auth.login.subtitle')}</Typography>
      </div>

      {login.isError && (
        <Alert severity="error">
          {apiErrorMessage(login.error, t, { 401: 'auth.login.invalidCredentials' })}
        </Alert>
      )}

      <FormTextField
        control={control}
        name="email"
        label={t('auth.fields.email')}
        type="email"
        autoComplete="email"
        autoFocus
      />
      <FormTextField
        control={control}
        name="password"
        label={t('auth.fields.password')}
        type="password"
        autoComplete="current-password"
      />

      <Button type="submit" variant="contained" size="large" loading={login.isPending}>
        {t('auth.login.submit')}
      </Button>

      <Typography variant="body2" color="text.secondary" className="text-center">
        {t('auth.login.noAccount')}{' '}
        <Link component={RouterLink} to="/auth/register">
          {t('auth.login.signUpLink')}
        </Link>
      </Typography>
    </form>
  )
}

export default LoginPage
