import { describe, expect, it } from 'vitest'
import type { Credential, CredentialTypeDescription } from '../../api/types'
import { credentialResolver, initialValues, toCredentialData } from './credentialForm'

// The backend's OAuth2 type, trimmed: a field shown for one grant type only,
// a required secret, a number.
const oauth2: CredentialTypeDescription = {
  type: 'oAuth2Api',
  displayName: 'OAuth2 API',
  oauth2: true,
  properties: [
    {
      name: 'grantType',
      displayName: 'Grant Type',
      type: 'options',
      default: 'authorizationCode',
      options: [
        { name: 'Authorization Code', value: 'authorizationCode' },
        { name: 'Client Credentials', value: 'clientCredentials' },
      ],
    },
    {
      name: 'authUrl',
      displayName: 'Authorization URL',
      type: 'string',
      default: '',
      required: true,
      displayOptions: { show: { grantType: ['authorizationCode'] } },
    },
    { name: 'clientId', displayName: 'Client ID', type: 'string', default: '', required: true },
    { name: 'clientSecret', displayName: 'Client Secret', type: 'string', default: '', required: true, secret: true },
    { name: 'timeout', displayName: 'Timeout', type: 'number', default: '' },
  ],
}

const resolve = async (values: ReturnType<typeof initialValues>, isEdit: boolean) => {
  const result = await credentialResolver(oauth2, isEdit)(values, undefined, { fields: {}, shouldUseNativeValidation: false })
  return result.errors as { name?: { message: string }; data?: Record<string, { message: string }> }
}

describe('credential form', () => {
  it('starts from the type defaults', () => {
    expect(initialValues(oauth2, 'OAuth2 API account')).toEqual({
      name: 'OAuth2 API account',
      data: { grantType: 'authorizationCode', authUrl: '', clientId: '', clientSecret: '', timeout: '' },
    })
  })

  it('requires the visible required fields only', async () => {
    const values = initialValues(oauth2, 'x')
    expect(Object.keys((await resolve(values, false)).data ?? {})).toEqual(['authUrl', 'clientId', 'clientSecret'])

    values.data.grantType = 'clientCredentials'
    expect(Object.keys((await resolve(values, false)).data ?? {})).toEqual(['clientId', 'clientSecret'])
  })

  it('checks numbers and the name', async () => {
    const values = { name: ' ', data: { ...initialValues(oauth2, 'x').data, timeout: 'abc' } }
    const errors = await resolve(values, false)
    expect(errors.name?.message).toBe('credentials.validation.nameRequired')
    expect(errors.data?.timeout.message).toBe('credentials.validation.number')
  })

  it('sends only shown fields, with numbers as numbers', () => {
    const values = {
      name: 'x',
      data: { grantType: 'clientCredentials', authUrl: 'hidden', clientId: 'id', clientSecret: 's', timeout: '5000' },
    }
    expect(toCredentialData(oauth2, values, false)).toEqual({
      grantType: 'clientCredentials',
      clientId: 'id',
      clientSecret: 's',
      timeout: 5000,
    })
  })

  describe('when editing', () => {
    const saved: Credential = {
      id: '1',
      name: 'Mine',
      type: 'oAuth2Api',
      data: { grantType: 'authorizationCode', authUrl: 'https://a', clientId: 'id' },
      createdAt: '',
      updatedAt: '',
    }
    const values = initialValues(oauth2, 'ignored', saved)

    it('loads saved values but never a secret', () => {
      expect(values.name).toBe('Mine')
      expect(values.data).toMatchObject({ authUrl: 'https://a', clientId: 'id', clientSecret: '' })
    })

    it('accepts an empty secret and leaves it out, so the saved one is kept', async () => {
      expect(await resolve(values, true)).toEqual({})
      expect(toCredentialData(oauth2, values, true)).not.toHaveProperty('clientSecret')
    })
  })
})
