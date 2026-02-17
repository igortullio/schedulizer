import { createAccessControl } from 'better-auth/plugins/access'

const statement = {
  member: ['invite', 'delete', 'list'],
  invitation: ['create', 'cancel'],
  organization: ['update', 'delete'],
  billing: ['manage'],
} as const

export const ac = createAccessControl(statement)

export const ownerRole = ac.newRole({
  member: ['invite', 'delete', 'list'],
  invitation: ['create', 'cancel'],
  organization: ['update', 'delete'],
  billing: ['manage'],
})

export const adminRole = ac.newRole({
  member: ['invite', 'delete', 'list'],
  invitation: ['create', 'cancel'],
})

export const memberRole = ac.newRole({
  member: ['list'],
})
