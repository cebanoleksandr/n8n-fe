import { describe, expect, it } from 'vitest'
import type { PropertySchema } from '../api/types'
import { defaultsOf, isEmptyValue, isPropertyVisible } from './properties'

const property = (extra: Partial<PropertySchema>): PropertySchema => ({
  name: 'x',
  displayName: 'X',
  type: 'string',
  default: '',
  ...extra,
})

describe('isPropertyVisible', () => {
  const authUrl = property({ displayOptions: { show: { grantType: ['authorizationCode'], mode: ['a', 'b'] } } })

  it('shows a property without displayOptions', () => {
    expect(isPropertyVisible(property({}), {})).toBe(true)
  })

  it('needs every listed field to hold one of its values', () => {
    expect(isPropertyVisible(authUrl, { grantType: 'authorizationCode', mode: 'b' })).toBe(true)
    expect(isPropertyVisible(authUrl, { grantType: 'clientCredentials', mode: 'b' })).toBe(false)
    expect(isPropertyVisible(authUrl, { grantType: 'authorizationCode' })).toBe(false)
  })
})

describe('defaultsOf', () => {
  it('collects defaults, skipping properties without one', () => {
    expect(
      defaultsOf([
        property({ name: 'method', default: 'GET' }),
        property({ name: 'timeout', default: 30000 }),
        property({ name: 'none', default: undefined }),
      ]),
    ).toEqual({ method: 'GET', timeout: 30000 })
  })
})

describe('isEmptyValue', () => {
  it('treats only missing values and empty strings as empty', () => {
    expect([undefined, null, ''].map(isEmptyValue)).toEqual([true, true, true])
    expect([0, false, [], ' '].map(isEmptyValue)).toEqual([false, false, false, false])
  })
})
