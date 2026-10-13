import type { FC } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { Credential, CredentialTypeDescription } from '../../api/types'
import {
  useConnectOAuth2Credential,
  useCreateCredential,
  useOAuth2RedirectUri,
  useUpdateCredential,
} from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import { apiErrorMessage } from '../../utils/apiErrorMessage'
import FormTextField from '../ui/FormTextField'
import CredentialField from './CredentialField'
import {
  credentialResolver,
  type CredentialFormValues,
  initialValues,
  isPropertyVisible,
  toCredentialData,
} from './credentialForm'

interface IProps {
  type: CredentialTypeDescription
  /** The saved credential; absent while creating. */
  credential?: Credential
  onSaved: (credential: Credential) => void
  onCancel: () => void
  /** Back to the type list; only before the first save. */
  onBack?: () => void
}

const CredentialForm: FC<IProps> = ({ type, credential, onSaved, onCancel, onBack }) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const isEdit = !!credential

  const create = useCreateCredential()
  const update = useUpdateCredential()
  const save = isEdit ? update : create
  const connect = useConnectOAuth2Credential()
  const redirectUri = useOAuth2RedirectUri()

  const { control, handleSubmit, formState } = useForm<CredentialFormValues>({
    resolver: credentialResolver(type, isEdit),
    defaultValues: initialValues(
      type,
      t('credentials.defaultName', { type: type.displayName }),
      credential,
    ),
  })
  const data = useWatch({ control, name: 'data' })

  // Authorization code: the user signs in at the provider. Client credentials
  // need no sign-in; the token is fetched when a node runs.
  const needsSignIn = !!type.oauth2 && data.grantType !== 'clientCredentials'

  const onSubmit = (values: CredentialFormValues) => {
    const input = { name: values.name.trim(), data: toCredentialData(type, values, isEdit) }
    const options = { onSuccess: onSaved }
    if (credential) update.mutate({ id: credential.id, input }, options)
    else create.mutate({ ...input, type: type.type }, options)
  }

  const handleConnect = () => {
    if (!credential) return
    connect.mutate(credential.id, {
      onSuccess: (result) =>
        dispatch(
          setAlertAC(
            result.ok
              ? { text: 'credentials.oauth2.connected', mode: 'success' }
              : { text: result.message || 'credentials.oauth2.connectFailed', mode: 'error' },
          ),
        ),
      onError: () =>
        dispatch(setAlertAC({ text: 'credentials.oauth2.connectFailed', mode: 'error' })),
    })
  }

  const copyRedirectUri = async () => {
    if (!redirectUri.data) return
    try {
      await navigator.clipboard.writeText(redirectUri.data.redirectUri)
      dispatch(setAlertAC({ text: 'common.copied', mode: 'success' }))
    } catch {
      // Clipboard blocked: the field is still selectable by hand.
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {save.isError && <Alert severity="error">{apiErrorMessage(save.error, t)}</Alert>}

      <FormTextField control={control} name="name" label={t('credentials.fields.name')} required />

      <Divider />

      {type.properties
        .filter((property) => isPropertyVisible(property, data))
        .map((property) => (
          <CredentialField
            key={property.name}
            property={property}
            control={control}
            isEdit={isEdit}
          />
        ))}

      {type.oauth2 && (
        <>
          <Divider />
          {needsSignIn && redirectUri.data && (
            <TextField
              label={t('credentials.oauth2.redirectUri')}
              value={redirectUri.data.redirectUri}
              helperText={t('credentials.oauth2.redirectUriHint')}
              fullWidth
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end" aria-label={t('common.copy')} onClick={copyRedirectUri}>
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}

          {needsSignIn && (
            <div className="flex items-center gap-3 flex-wrap">
              {credential?.oauth2?.connected ? (
                <Chip color="success" variant="outlined" label={t('credentials.oauth2.connectedStatus')} />
              ) : (
                <Chip color="warning" variant="outlined" label={t('credentials.oauth2.notConnected')} />
              )}
              <Button
                variant="outlined"
                onClick={handleConnect}
                loading={connect.isPending}
                // Connecting uses the saved settings, not the ones on screen.
                disabled={!credential || formState.isDirty}
              >
                {t(credential?.oauth2?.connected ? 'credentials.oauth2.reconnect' : 'credentials.oauth2.connect')}
              </Button>
              {(!credential || formState.isDirty) && (
                <Typography variant="caption" color="text.secondary">
                  {t('credentials.oauth2.saveFirst')}
                </Typography>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex items-center gap-2 pt-2">
        {onBack && <Button onClick={onBack}>{t('common.back')}</Button>}
        <div className="flex-1" />
        <Button onClick={onCancel} disabled={save.isPending}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="contained" loading={save.isPending}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

export default CredentialForm
