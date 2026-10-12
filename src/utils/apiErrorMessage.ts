import type { TFunction } from 'i18next'
import { getErrorMessage, getErrorStatus, isApiError } from '../api/client'

/**
 * Translated text for a failed request. `byStatus` maps statuses the caller
 * knows about to translation keys; anything else falls back to the server's
 * own (English) message.
 */
export function apiErrorMessage(
  error: unknown,
  t: TFunction,
  byStatus: Record<number, string> = {},
): string {
  if (isApiError(error) && !error.response) return t('errors.network')

  const status = getErrorStatus(error)
  if (status && byStatus[status]) return t(byStatus[status])
  if (status === 429) return t('errors.tooManyRequests')
  return getErrorMessage(error)
}
