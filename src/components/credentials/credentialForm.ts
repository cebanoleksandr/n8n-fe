import type { FieldError, Resolver } from 'react-hook-form'
import type { Credential, CredentialTypeDescription, PropertySchema } from '../../api/types'

export interface CredentialFormValues {
  name: string
  data: Record<string, unknown>
}

/** displayOptions.show: every listed field must hold one of its values. */
export function isPropertyVisible(property: PropertySchema, data: Record<string, unknown>) {
  const show = property.displayOptions?.show
  if (!show) return true
  return Object.entries(show).every(([field, values]) => values.includes(data[field]))
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === ''
}

/** Defaults of the type, overlaid with a saved credential's (non-secret) data. */
export function initialValues(
  type: CredentialTypeDescription,
  name: string,
  credential?: Credential,
): CredentialFormValues {
  const data: Record<string, unknown> = {}
  for (const property of type.properties) {
    // Secrets are never sent back: empty means "keep the saved one".
    const saved = property.secret ? undefined : credential?.data[property.name]
    data[property.name] = saved ?? property.default ?? ''
  }
  return { name: credential?.name ?? name, data }
}

/**
 * Validates only the fields currently shown. Messages are translation keys.
 * When editing, a required secret may stay empty: the saved value is kept.
 */
export function credentialResolver(
  type: CredentialTypeDescription,
  isEdit: boolean,
): Resolver<CredentialFormValues> {
  return async (values) => {
    const dataErrors: Record<string, FieldError> = {}
    for (const property of type.properties) {
      if (!isPropertyVisible(property, values.data)) continue
      const value = values.data[property.name]
      if (isEmpty(value)) {
        if (property.required && !(isEdit && property.secret)) {
          dataErrors[property.name] = { type: 'required', message: 'credentials.validation.required' }
        }
      } else if (property.type === 'number' && Number.isNaN(Number(value))) {
        dataErrors[property.name] = { type: 'number', message: 'credentials.validation.number' }
      }
    }

    const errors: Record<string, unknown> = {}
    if (!values.name.trim()) {
      errors.name = { type: 'required', message: 'credentials.validation.nameRequired' }
    }
    if (Object.keys(dataErrors).length) errors.data = dataErrors

    return Object.keys(errors).length
      ? { values: {}, errors: errors as never }
      : { values, errors: {} }
  }
}

/**
 * The data to send: shown fields only, numbers as numbers. Empty secrets are
 * left out when editing, so the API keeps the stored ones.
 */
export function toCredentialData(
  type: CredentialTypeDescription,
  values: CredentialFormValues,
  isEdit: boolean,
): Record<string, unknown> {
  const data: Record<string, unknown> = {}
  for (const property of type.properties) {
    if (!isPropertyVisible(property, values.data)) continue
    const value = values.data[property.name]
    if (isEdit && property.secret && isEmpty(value)) continue
    if (property.type === 'number') {
      if (!isEmpty(value)) data[property.name] = Number(value)
      continue
    }
    data[property.name] = value
  }
  return data
}
