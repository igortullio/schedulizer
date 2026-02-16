import { describe, expect, it } from 'vitest'
import { ac, adminRole, memberRole, ownerRole } from '../access-control'

describe('Access Control', () => {
  it('should export ac instance', () => {
    expect(ac).toBeDefined()
    expect(ac.newRole).toBeTypeOf('function')
  })

  it('should export ownerRole', () => {
    expect(ownerRole).toBeDefined()
  })

  it('should export adminRole', () => {
    expect(adminRole).toBeDefined()
  })

  it('should export memberRole', () => {
    expect(memberRole).toBeDefined()
  })

  describe('ownerRole permissions', () => {
    it('should have statements property', () => {
      expect(ownerRole).toHaveProperty('statements')
    })

    it('should grant all member actions', () => {
      expect(ownerRole.statements.member).toEqual(expect.arrayContaining(['invite', 'remove', 'list']))
    })

    it('should grant all organization actions', () => {
      expect(ownerRole.statements.organization).toEqual(expect.arrayContaining(['update', 'delete']))
    })

    it('should grant billing manage action', () => {
      expect(ownerRole.statements.billing).toEqual(expect.arrayContaining(['manage']))
    })

    it('should contain member, organization, and billing resources', () => {
      const statements = ownerRole.statements
      expect(statements).toHaveProperty('member')
      expect(statements).toHaveProperty('organization')
      expect(statements).toHaveProperty('billing')
    })
  })

  describe('adminRole permissions', () => {
    it('should grant all member actions', () => {
      expect(adminRole.statements.member).toEqual(expect.arrayContaining(['invite', 'remove', 'list']))
    })

    it('should not include organization or billing resources', () => {
      const statements = adminRole.statements as Record<string, unknown>
      expect(statements).not.toHaveProperty('organization')
      expect(statements).not.toHaveProperty('billing')
    })
  })

  describe('memberRole permissions', () => {
    it('should grant only member list action', () => {
      expect(memberRole.statements.member).toEqual(expect.arrayContaining(['list']))
      expect(memberRole.statements.member).not.toContain('invite')
      expect(memberRole.statements.member).not.toContain('remove')
    })

    it('should not include organization or billing resources', () => {
      const statements = memberRole.statements as Record<string, unknown>
      expect(statements).not.toHaveProperty('organization')
      expect(statements).not.toHaveProperty('billing')
    })
  })
})
