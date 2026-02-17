import { describe, expect, it } from 'vitest'
import { canAccessMembersPage, hasPermission } from './permissions'

describe('hasPermission', () => {
  it('grants owner all member actions', () => {
    expect(hasPermission('owner', 'member', 'invite')).toBe(true)
    expect(hasPermission('owner', 'member', 'remove')).toBe(true)
    expect(hasPermission('owner', 'member', 'list')).toBe(true)
  })

  it('grants admin invite, remove and list member actions', () => {
    expect(hasPermission('admin', 'member', 'invite')).toBe(true)
    expect(hasPermission('admin', 'member', 'remove')).toBe(true)
    expect(hasPermission('admin', 'member', 'list')).toBe(true)
  })

  it('grants member only list action', () => {
    expect(hasPermission('member', 'member', 'invite')).toBe(false)
    expect(hasPermission('member', 'member', 'remove')).toBe(false)
    expect(hasPermission('member', 'member', 'list')).toBe(true)
  })

  it('grants owner organization update and delete', () => {
    expect(hasPermission('owner', 'organization', 'update')).toBe(true)
    expect(hasPermission('owner', 'organization', 'delete')).toBe(true)
  })

  it('denies admin and member organization actions', () => {
    expect(hasPermission('admin', 'organization', 'update')).toBe(false)
    expect(hasPermission('admin', 'organization', 'delete')).toBe(false)
    expect(hasPermission('member', 'organization', 'update')).toBe(false)
    expect(hasPermission('member', 'organization', 'delete')).toBe(false)
  })

  it('grants owner billing manage', () => {
    expect(hasPermission('owner', 'billing', 'manage')).toBe(true)
  })

  it('denies admin and member billing manage', () => {
    expect(hasPermission('admin', 'billing', 'manage')).toBe(false)
    expect(hasPermission('member', 'billing', 'manage')).toBe(false)
  })

  it('returns false for unknown resource', () => {
    expect(hasPermission('owner', 'unknown', 'action')).toBe(false)
  })

  it('returns false for unknown action', () => {
    expect(hasPermission('owner', 'member', 'unknown')).toBe(false)
  })
})

describe('canAccessMembersPage', () => {
  it('allows owner to access members page', () => {
    expect(canAccessMembersPage('owner')).toBe(true)
  })

  it('allows admin to access members page', () => {
    expect(canAccessMembersPage('admin')).toBe(true)
  })

  it('denies member access to members page', () => {
    expect(canAccessMembersPage('member')).toBe(false)
  })
})
