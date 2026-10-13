import { useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined'
import SearchOffIcon from '@mui/icons-material/SearchOff'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import CredentialCard from '../../components/credentials/CredentialCard'
import CredentialPopup from '../../components/credentials/CredentialPopup'
import ListToolbar from '../../components/ui/ListToolbar'
import { useCredentials, useCredentialTypes, useHasRole } from '../../hooks/api'
import { useListParams } from '../../hooks/useListParams'
import { sortItems } from '../../utils/sorting'

const NEW = 'new'

const CredentialsPage = () => {
  const { t } = useTranslation()
  const canEdit = useHasRole('editor')
  const { search, sort, update } = useListParams()
  const [searchParams, setSearchParams] = useSearchParams()

  const credentials = useCredentials()
  const types = useCredentialTypes()

  // The popup lives in the URL: ?new=1 (also set by the header button) or ?edit=<id>.
  const target = searchParams.get('edit') ?? (searchParams.has('new') ? NEW : null)
  // Kept after closing, so the popup doesn't change while it animates out.
  const [lastTarget, setLastTarget] = useState(target)
  if (target && target !== lastTarget) setLastTarget(target)

  const setPopup = (next: { edit?: string; new?: boolean } | null) => {
    setSearchParams(
      (params) => {
        params.delete('new')
        params.delete('edit')
        if (next?.edit) params.set('edit', next.edit)
        if (next?.new) params.set('new', '1')
        return params
      },
      { replace: true },
    )
  }

  const typeNames = useMemo(
    () => new Map(types.data?.map((type) => [type.type, type.displayName])),
    [types.data],
  )
  const typeName = (type: string) => typeNames.get(type) ?? type

  // The API returns the whole list, so search and sort happen here.
  const visible = useMemo(() => {
    if (!credentials.data) return []
    const query = search.toLowerCase()
    const matching = credentials.data.filter(
      (credential) =>
        credential.name.toLowerCase().includes(query) ||
        (typeNames.get(credential.type) ?? credential.type).toLowerCase().includes(query),
    )
    return sortItems(matching, sort)
  }, [credentials.data, typeNames, search, sort])

  const renderList = () => {
    if (credentials.isPending) {
      return (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} variant="rounded" height={62} />
          ))}
        </div>
      )
    }

    if (credentials.isError) {
      return (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => credentials.refetch()}>
              {t('common.retry')}
            </Button>
          }
        >
          {t('credentials.loadFailed')}
        </Alert>
      )
    }

    if (credentials.data.length === 0) {
      return (
        <Paper className="flex flex-col items-center gap-3 text-center px-6 py-16">
          <KeyOutlinedIcon color="primary" sx={{ fontSize: 48 }} />
          <Typography variant="h3">{t('credentials.empty.title')}</Typography>
          <Typography color="text.secondary" className="max-w-sm">
            {t('credentials.empty.text')}
          </Typography>
          {canEdit && (
            <Button variant="contained" onClick={() => setPopup({ new: true })}>
              {t('credentials.create')}
            </Button>
          )}
        </Paper>
      )
    }

    if (visible.length === 0) {
      return (
        <Paper className="flex flex-col items-center gap-3 text-center px-6 py-16">
          <SearchOffIcon color="disabled" sx={{ fontSize: 48 }} />
          <Typography variant="h3">{t('credentials.notFound.title')}</Typography>
          <Typography color="text.secondary" className="max-w-sm">
            {t('credentials.notFound.text', { search })}
          </Typography>
          <Button onClick={() => update({ search: '' })}>{t('common.clearSearch')}</Button>
        </Paper>
      )
    }

    return (
      <div className="flex flex-col gap-2">
        {visible.map((credential) => (
          <CredentialCard
            key={credential.id}
            credential={credential}
            typeName={typeName(credential.type)}
            onEdit={canEdit ? () => setPopup({ edit: credential.id }) : undefined}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ListToolbar
        search={search}
        sort={sort}
        searchPlaceholder={t('credentials.search')}
        onSearchChange={(next) => update({ search: next })}
        onSortChange={(next) => update({ sort: next })}
      />
      {renderList()}

      {canEdit && (
        <CredentialPopup
          isVisible={!!target}
          onClose={() => setPopup(null)}
          credentialId={lastTarget && lastTarget !== NEW ? lastTarget : undefined}
        />
      )}
    </div>
  )
}

export default CredentialsPage
