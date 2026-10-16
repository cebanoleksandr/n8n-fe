import { hasRole, ROLES, type Role } from '../api/types'

// Mirrors the backend's rules (members.service.ts); the server enforces them.

/** Whether `me` may change the role of, or remove, a member with `target`. */
export function canManageMember(me: Role, target: Role): boolean {
  if (!hasRole(me, 'admin')) return false
  return !hasRole(target, 'admin') || me === 'owner'
}

/** Roles `me` may give, in an invitation or a role change. */
export function grantableRoles(me: Role): Role[] {
  if (me === 'owner') return [...ROLES]
  if (hasRole(me, 'admin')) return ROLES.filter((role) => !hasRole(role, 'admin'))
  return []
}
