import type { PropertySchema } from '../api/types'

/**
 * displayOptions.show: every listed field must hold one of its values.
 * Also used for a node type's credential slots, which have displayOptions too.
 */
export function isPropertyVisible(
  property: Pick<PropertySchema, 'displayOptions'>,
  values: Record<string, unknown>,
) {
  const show = property.displayOptions?.show
  if (!show) return true
  return Object.entries(show).every(([field, allowed]) => allowed.includes(values[field]))
}

/** Each property's default, e.g. for a new node or a new list item. */
export function defaultsOf(properties: PropertySchema[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  for (const property of properties) {
    if (property.default !== undefined) values[property.name] = property.default
  }
  return values
}

export function isEmptyValue(value: unknown) {
  return value === undefined || value === null || value === ''
}
