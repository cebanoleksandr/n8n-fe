import { describe, expect, it } from 'vitest'
import { canManageMember, grantableRoles } from './roles'

describe('canManageMember', () => {
  it('lets admins manage editors and viewers only', () => {
    expect(canManageMember('admin', 'editor')).toBe(true)
    expect(canManageMember('admin', 'viewer')).toBe(true)
    expect(canManageMember('admin', 'admin')).toBe(false)
    expect(canManageMember('admin', 'owner')).toBe(false)
  })

  it('lets owners manage everyone', () => {
    expect(canManageMember('owner', 'admin')).toBe(true)
    expect(canManageMember('owner', 'owner')).toBe(true)
  })

  it('lets editors and viewers manage no one', () => {
    expect(canManageMember('editor', 'viewer')).toBe(false)
    expect(canManageMember('viewer', 'viewer')).toBe(false)
  })
})

describe('grantableRoles', () => {
  it('follows who may grant admin and owner', () => {
    expect(grantableRoles('owner')).toEqual(['viewer', 'editor', 'admin', 'owner'])
    expect(grantableRoles('admin')).toEqual(['viewer', 'editor'])
    expect(grantableRoles('editor')).toEqual([])
  })
})
