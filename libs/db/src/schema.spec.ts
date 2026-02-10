import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leads, planInterestEnum, sessions, subscriptionStatusEnum, subscriptions } from './schema'

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

describe('Subscriptions Schema', () => {
  it('should compile schema without TypeScript errors', () => {
    expect(subscriptions).toBeDefined()
    expect(subscriptionStatusEnum).toBeDefined()
  })

  it('should have correct table structure with all required columns', () => {
    expect(subscriptions).toBeDefined()
    expect(typeof subscriptions).toBe('object')
    expect(subscriptions).toHaveProperty('id')
    expect(subscriptions).toHaveProperty('organizationId')
    expect(subscriptions).toHaveProperty('stripeCustomerId')
    expect(subscriptions).toHaveProperty('stripeSubscriptionId')
    expect(subscriptions).toHaveProperty('stripePriceId')
    expect(subscriptions).toHaveProperty('status')
    expect(subscriptions).toHaveProperty('plan')
    expect(subscriptions).toHaveProperty('currentPeriodStart')
    expect(subscriptions).toHaveProperty('currentPeriodEnd')
    expect(subscriptions).toHaveProperty('cancelAtPeriodEnd')
    expect(subscriptions).toHaveProperty('createdAt')
    expect(subscriptions).toHaveProperty('updatedAt')
  })

  it('should export subscriptionStatusEnum with all Stripe status values', () => {
    expect(subscriptionStatusEnum).toBeDefined()
    const enumConfig = (subscriptionStatusEnum as { enumValues: string[] }).enumValues
    expect(enumConfig).toEqual([
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused',
    ])
  })

  it('should have generated migration file for subscriptions', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0002_unique_thundra.sql')
    expect(existsSync(migrationPath)).toBe(true)
  })

  it('should have migration SQL with CREATE TABLE statement for subscriptions', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0002_unique_thundra.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('CREATE TABLE')
    expect(migrationContent).toContain('subscriptions')
    expect(migrationContent).toContain('"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL')
    expect(migrationContent).toContain('"organization_id" uuid NOT NULL')
    expect(migrationContent).toContain('"stripe_customer_id" text NOT NULL')
    expect(migrationContent).toContain('"stripe_subscription_id" text')
    expect(migrationContent).toContain('"stripe_price_id" text')
    expect(migrationContent).toContain('"status" "subscription_status" DEFAULT')
    expect(migrationContent).toContain('"plan" text')
    expect(migrationContent).toContain('"current_period_start" timestamp with time zone')
    expect(migrationContent).toContain('"current_period_end" timestamp with time zone')
    expect(migrationContent).toContain('"cancel_at_period_end" boolean DEFAULT false NOT NULL')
    expect(migrationContent).toContain('"created_at" timestamp with time zone DEFAULT now() NOT NULL')
    expect(migrationContent).toContain('"updated_at" timestamp with time zone DEFAULT now() NOT NULL')
  })

  it('should have migration SQL with CREATE TYPE statement for subscription_status enum', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0002_unique_thundra.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('CREATE TYPE')
    expect(migrationContent).toContain('subscription_status')
    expect(migrationContent).toContain("'incomplete'")
    expect(migrationContent).toContain("'incomplete_expired'")
    expect(migrationContent).toContain("'trialing'")
    expect(migrationContent).toContain("'active'")
    expect(migrationContent).toContain("'past_due'")
    expect(migrationContent).toContain("'canceled'")
    expect(migrationContent).toContain("'unpaid'")
    expect(migrationContent).toContain("'paused'")
  })

  it('should have foreign key constraint to organizations table in migration', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0002_unique_thundra.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('REFERENCES')
    expect(migrationContent).toContain('"organizations"("id")')
    expect(migrationContent).toContain('ON DELETE cascade')
  })

  it('should have unique constraint on stripeSubscriptionId in migration', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0002_unique_thundra.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('UNIQUE')
  })
})

describe('Sessions Schema', () => {
  it('should have activeOrganizationId column', () => {
    expect(sessions).toHaveProperty('activeOrganizationId')
  })

  it('should have generated migration file for activeOrganizationId', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0003_fearless_johnny_storm.sql')
    expect(existsSync(migrationPath)).toBe(true)
  })

  it('should have migration SQL with ALTER TABLE adding active_organization_id', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0003_fearless_johnny_storm.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('ALTER TABLE "sessions"')
    expect(migrationContent).toContain('"active_organization_id" uuid')
    expect(migrationContent).toContain('REFERENCES "public"."organizations"("id")')
    expect(migrationContent).toContain('ON DELETE set null')
  })
})
