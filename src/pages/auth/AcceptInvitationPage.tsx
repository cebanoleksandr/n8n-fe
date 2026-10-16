import type { FC } from 'react'
import { yupResolver } from '@hookform/resolvers/yup'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useQueryClient } from '@tanstack/react-query'
import { type Resolver, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as yup from 'yup'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { getErrorStatus } from '../../api/client'
import { queryKeys } from '../../api/query-keys'
import type { InvitationInfo, Me } from '../../api/types'
import FormTextField from '../../components/ui/FormTextField'
import { useAcceptInvitation, useInvitationInfo, useSwitchWorkspace } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { apiErrorMessage } from '../../utils/apiErrorMessage'

const password = yup
  .string()
  .required('auth.validation.passwordRequired')
  .max(256, 'auth.validation.passwordTooLong')

// An existing account proves itself with its password.
const existingSchema = yup.object({ password })

// A new account is created: same rules as sign-up.
const newSchema = yup.object({
  name: yup.string().trim().required('auth.validation.nameRequired').max(128, 'auth.validation.nameTooLong'),
  password: password.min(8, 'auth.validation.passwordTooShort'),
  confirmPassword: yup
    .string()
    .required('auth.validation.confirmPasswordRequired')
    .oneOf([yup.ref('password')], 'auth.validation.passwordsMismatch'),
})

type FormValues = { name?: string; password: string; confirmPassword?: string }

const AcceptForm: FC<{ token: string; info: InvitationInfo }> = ({ token, info }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const switchWorkspace = useSwitchWorkspace()
  const accept = useAcceptInvitation()

  const { control, handleSubmit, setError } = useForm<FormValues>({
    // One form, two schemas: the account either exists or is being created.
    resolver: (info.hasAccount ? yupResolver(existingSchema) : yupResolver(newSchema)) as unknown as Resolver<FormValues>,
    defaultValues: { name: '', password: '', confirmPassword: '' },
  })

  const onSubmit = (values: FormValues) => {
    accept.mutate(
      { token, input: info.hasAccount ? { password: values.password } : { name: values.name, password: values.password } },
      {
        onSuccess: () => {
          // Open the workspace just joined. The invitation names it, not its id.
          const me = queryClient.getQueryData<Me | null>(queryKeys.auth.me)
          const joined = me?.workspaces.find((w) => w.workspaceName === info.workspaceName)
          if (joined) switchWorkspace(joined.workspaceId)
          dispatch(setAlertAC({ text: 'invitation.joined', mode: 'success' }))
          navigate('/workflows', { replace: true })
        },
        onError: (error) => {
          if (getErrorStatus(error) === 401) setError('password', { message: 'invitation.wrongPassword' })
        },
      },
    )
  }

  const formError =
    accept.isError && getErrorStatus(accept.error) !== 401
      ? apiErrorMessage(accept.error, t, { 404: 'invitation.notFound' })
      : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {formError && <Alert severity="error">{formError}</Alert>}
      <Typography variant="body2" color="text.secondary">
        {t(info.hasAccount ? 'invitation.existingAccount' : 'invitation.newAccount', { email: info.email })}
      </Typography>
      {!info.hasAccount && (
        <FormTextField control={control} name="name" label={t('auth.fields.name')} autoComplete="name" autoFocus />
      )}
      <FormTextField
        control={control}
        name="password"
        label={t('auth.fields.password')}
        type="password"
        autoComplete={info.hasAccount ? 'current-password' : 'new-password'}
        autoFocus={info.hasAccount}
        helperText={info.hasAccount ? undefined : t('auth.register.passwordHint')}
      />
      {!info.hasAccount && (
        <FormTextField
          control={control}
          name="confirmPassword"
          label={t('auth.fields.confirmPassword')}
          type="password"
          autoComplete="new-password"
        />
      )}
      <Button type="submit" variant="contained" size="large" loading={accept.isPending}>
        {t('invitation.accept')}
      </Button>
    </form>
  )
}

/** /auth/invite/:token — the link an admin shared from the members settings. */
const AcceptInvitationPage = () => {
  const { t } = useTranslation()
  const { token } = useParams()
  const info = useInvitationInfo(token)

  if (info.isPending) {
    return (
      <div className="flex justify-center py-10">
        <CircularProgress />
      </div>
    )
  }

  if (info.isError) {
    return (
      <div className="flex flex-col gap-4">
        <Typography variant="h2">{t('invitation.title')}</Typography>
        <Alert severity="error">{apiErrorMessage(info.error, t, { 404: 'invitation.notFound' })}</Alert>
        <Link component={RouterLink} to="/auth/login">
          {t('auth.register.signInLink')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Typography variant="h2">{t('invitation.join', { workspace: info.data.workspaceName })}</Typography>
        <Typography color="text.secondary">
          {t('invitation.invitedAs', { role: t(`roles.${info.data.role}`) })}
        </Typography>
      </div>
      <AcceptForm token={token!} info={info.data} />
    </div>
  )
}

export default AcceptInvitationPage
