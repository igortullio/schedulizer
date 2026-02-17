export type Role = 'owner' | 'admin' | 'member'

const PERMISSION_MAP: Record<string, Record<string, Role[]>> = {
  member: {
    invite: ['owner', 'admin'],
    remove: ['owner', 'admin'],
    list: ['owner', 'admin', 'member'],
  },
  organization: {
    update: ['owner'],
    delete: ['owner'],
  },
  billing: {
    manage: ['owner'],
  },
}

export function hasPermission(role: Role, resource: string, action: string): boolean {
  return PERMISSION_MAP[resource]?.[action]?.includes(role) ?? false
}

export function canAccessMembersPage(role: Role): boolean {
  return role === 'owner' || role === 'admin'
}
