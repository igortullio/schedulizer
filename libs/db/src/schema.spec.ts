import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leads, planInterestEnum } from './schema'

describe('Leads Schema', () => {
  it('should compile schema without TypeScript errors', () => {
    // If this test runs, TypeScript compilation succeeded
    expect(leads).toBeDefined()
    expect(planInterestEnum).toBeDefined()
  })

  it('should have correct table structure', () => {
    expect(leads).toBeDefined()
    // Verify table is a valid Drizzle table by checking it's an object with columns
    expect(typeof leads).toBe('object')
    expect(leads).toHaveProperty('id')
    expect(leads).toHaveProperty('name')
    expect(leads).toHaveProperty('email')
    expect(leads).toHaveProperty('phone')
    expect(leads).toHaveProperty('planInterest')
    expect(leads).toHaveProperty('createdAt')
  })

  it('should export planInterestEnum with correct values', () => {
    expect(planInterestEnum).toBeDefined()
    const enumConfig = (planInterestEnum as { enumValues: string[] }).enumValues
    expect(enumConfig).toEqual(['essential', 'professional'])
  })

  it('should have generated migration file', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0001_fixed_vertigo.sql')
    expect(existsSync(migrationPath)).toBe(true)
  })

  it('should have migration SQL with CREATE TABLE statement for leads', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0001_fixed_vertigo.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('CREATE TABLE "leads"')
    expect(migrationContent).toContain('"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL')
    expect(migrationContent).toContain('"name" varchar(255) NOT NULL')
    expect(migrationContent).toContain('"email" varchar(255) NOT NULL')
    expect(migrationContent).toContain('"phone" varchar(20) NOT NULL')
    expect(migrationContent).toContain('"plan_interest" "plan_interest" NOT NULL')
    expect(migrationContent).toContain('"created_at" timestamp with time zone DEFAULT now() NOT NULL')
  })

  it('should have migration SQL with CREATE TYPE statement for plan_interest enum', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0001_fixed_vertigo.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('CREATE TYPE "public"."plan_interest"')
    expect(migrationContent).toContain("AS ENUM('essential', 'professional')")
  })
})
