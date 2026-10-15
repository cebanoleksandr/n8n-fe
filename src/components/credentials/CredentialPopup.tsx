import { useId, useMemo, useState, type FC } from 'react'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SearchIcon from '@mui/icons-material/Search'
import { useTranslation } from 'react-i18next'
import type { Credential, CredentialTypeDescription } from '../../api/types'
import { useCredential, useCredentialTypes } from '../../hooks/api'
import { setAlertAC } from '../../storage/alertSlice'
import { useAppDispatch } from '../../storage/hooks'
import BasePopup from '../popups/BasePopup'
import CredentialForm from './CredentialForm'
import CredentialTypeAvatar from './CredentialTypeAvatar'

interface IProps {
  isVisible: boolean
  onClose: () => void
  /** The credential to edit; absent to create one. */
  credentialId?: string
  /** Creating: skip the type list (e.g. from a node that needs this type). */
  initialType?: string
  /** After a save, e.g. to select the new credential in a node. */
  onSaved?: (credential: Credential) => void
}

const TypePicker: FC<{
  types: CredentialTypeDescription[]
  onPick: (type: string) => void
}> = ({ types, onPick }) => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...types]
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .filter((type) => type.displayName.toLowerCase().includes(query))
  }, [types, search])

  return (
    <div className="flex flex-col gap-3">
      <TextField
        size="small"
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('credentials.searchTypes')}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      <List dense className="max-h-96 overflow-y-auto" disablePadding>
        {filtered.map((type) => (
          <ListItemButton
            key={type.type}
            onClick={() => onPick(type.type)}
            sx={{ borderRadius: 1, gap: 1.5 }}
          >
            <CredentialTypeAvatar type={type.type} displayName={type.displayName} size={28} />
            <Typography variant="body2">{type.displayName}</Typography>
          </ListItemButton>
        ))}
        {filtered.length === 0 && (
          <Typography color="text.secondary" className="text-center py-6">
            {t('credentials.noTypes')}
          </Typography>
        )}
      </List>
    </div>
  )
}

/** Create (choose a type, then fill it in) or edit a credential. */
const CredentialPopup: FC<IProps> = ({
  isVisible,
  onClose,
  credentialId,
  initialType,
  onSaved,
}) => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const titleId = useId()

  const [chosenType, setChosenType] = useState<string | null>(initialType ?? null)
  // A created OAuth2 credential stays open to be connected.
  const [savedId, setSavedId] = useState<string | null>(null)

  // Start over each time the popup opens.
  const [wasVisible, setWasVisible] = useState(isVisible)
  if (isVisible !== wasVisible) {
    setWasVisible(isVisible)
    if (isVisible) {
      setChosenType(initialType ?? null)
      setSavedId(null)
    }
  }

  const id = credentialId ?? savedId ?? undefined
  const types = useCredentialTypes()
  const credential = useCredential(isVisible ? id : undefined)

  const typeName = credential.data?.type ?? chosenType
  const type = types.data?.find((item) => item.type === typeName)

  const handleSaved = (saved: Credential) => {
    onSaved?.(saved)
    const savedType = types.data?.find((item) => item.type === saved.type)
    const connectNext =
      !id && savedType?.oauth2 && saved.data.grantType !== 'clientCredentials'
    if (connectNext) {
      setSavedId(saved.id)
      return
    }
    dispatch(setAlertAC({ text: 'credentials.saved', mode: 'success' }))
    onClose()
  }

  const title = id
    ? t('credentials.editTitle')
    : type
      ? t('credentials.newTitle', { type: type.displayName })
      : t('credentials.chooseType')

  const renderContent = () => {
    if (types.isPending || (id && credential.isPending)) {
      return (
        <div className="flex justify-center py-10">
          <CircularProgress />
        </div>
      )
    }
    if (types.isError || credential.isError) {
      return <Alert severity="error">{t('credentials.loadOneFailed')}</Alert>
    }
    if (!typeName) {
      return <TypePicker types={types.data} onPick={setChosenType} />
    }
    if (!type) {
      return <Alert severity="error">{t('credentials.unknownType', { type: typeName })}</Alert>
    }
    return (
      <CredentialForm
        // Saving a new credential turns the form into an edit form.
        key={id ?? 'new'}
        type={type}
        credential={credential.data}
        onSaved={handleSaved}
        onCancel={onClose}
        onBack={id || initialType ? undefined : () => setChosenType(null)}
      />
    )
  }

  return (
    <BasePopup
      isVisible={isVisible}
      onClose={onClose}
      labelledBy={titleId}
      style={{ width: 560, maxWidth: '92vw', padding: 24 }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {type && <CredentialTypeAvatar type={type.type} displayName={type.displayName} />}
          <Typography id={titleId} variant="h3">
            {title}
          </Typography>
        </div>
        {savedId && !credentialId && (
          <Alert severity="info">{t('credentials.oauth2.connectNow')}</Alert>
        )}
        {renderContent()}
      </div>
    </BasePopup>
  )
}

export default CredentialPopup
