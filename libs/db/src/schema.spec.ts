import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  appointmentStatusEnum,
  appointments,
  leads,
  organizations,
  planInterestEnum,
  schedulePeriods,
  schedules,
  sessions,
  subscriptionStatusEnum,
  subscriptions,
  timeBlocks,
} from './schema'

describe('Leads Schema', () => {
  it('should compile schema without TypeScript errors', () => {
    expect(leads).toBeDefined()
    expect(planInterestEnum).toBeDefined()
  })

  it('should have correct table structure', () => {
    expect(leads).toBeDefined()
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

describe('Organizations Schema', () => {
  it('should have timezone column', () => {
    expect(organizations).toHaveProperty('timezone')
  })

  it('should have language column', () => {
    expect(organizations).toHaveProperty('language')
  })
})

describe('Schedules Schema', () => {
  it('should have serviceId column instead of organizationId', () => {
    expect(schedules).toHaveProperty('serviceId')
    expect(schedules).not.toHaveProperty('organizationId')
  })

  it('should have isActive column instead of active', () => {
    expect(schedules).toHaveProperty('isActive')
    expect(schedules).not.toHaveProperty('active')
  })

  it('should not have startTime and endTime columns', () => {
    expect(schedules).not.toHaveProperty('startTime')
    expect(schedules).not.toHaveProperty('endTime')
  })
})

describe('Schedule Periods Schema', () => {
  it('should have correct table structure', () => {
    expect(schedulePeriods).toBeDefined()
    expect(schedulePeriods).toHaveProperty('id')
    expect(schedulePeriods).toHaveProperty('scheduleId')
    expect(schedulePeriods).toHaveProperty('startTime')
    expect(schedulePeriods).toHaveProperty('endTime')
    expect(schedulePeriods).toHaveProperty('createdAt')
    expect(schedulePeriods).toHaveProperty('updatedAt')
  })
})

describe('Time Blocks Schema', () => {
  it('should have correct table structure', () => {
    expect(timeBlocks).toBeDefined()
    expect(timeBlocks).toHaveProperty('id')
    expect(timeBlocks).toHaveProperty('organizationId')
    expect(timeBlocks).toHaveProperty('date')
    expect(timeBlocks).toHaveProperty('startTime')
    expect(timeBlocks).toHaveProperty('endTime')
    expect(timeBlocks).toHaveProperty('reason')
    expect(timeBlocks).toHaveProperty('createdAt')
    expect(timeBlocks).toHaveProperty('updatedAt')
  })
})

describe('Appointments Schema', () => {
  it('should have updated column structure', () => {
    expect(appointments).toHaveProperty('startDatetime')
    expect(appointments).toHaveProperty('endDatetime')
    expect(appointments).toHaveProperty('managementToken')
    expect(appointments).toHaveProperty('reminderSentAt')
    expect(appointments).toHaveProperty('customerPhone')
  })

  it('should have language column', () => {
    expect(appointments).toHaveProperty('language')
  })

  it('should not have old columns', () => {
    expect(appointments).not.toHaveProperty('customerId')
    expect(appointments).not.toHaveProperty('startTime')
    expect(appointments).not.toHaveProperty('endTime')
  })

  it('should export appointmentStatusEnum with correct values', () => {
    expect(appointmentStatusEnum).toBeDefined()
    const enumConfig = (appointmentStatusEnum as { enumValues: string[] }).enumValues
    expect(enumConfig).toEqual(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
  })
})

describe('Scheduling Migration (0004)', () => {
  it('should have generated migration file', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    expect(existsSync(migrationPath)).toBe(true)
  })

  it('should create appointment_status enum', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('CREATE TYPE "public"."appointment_status"')
    expect(migrationContent).toContain("'pending'")
    expect(migrationContent).toContain("'confirmed'")
    expect(migrationContent).toContain("'cancelled'")
    expect(migrationContent).toContain("'completed'")
    expect(migrationContent).toContain("'no_show'")
  })

  it('should create schedule_periods table', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('CREATE TABLE "schedule_periods"')
    expect(migrationContent).toContain('"schedule_id" uuid NOT NULL')
    expect(migrationContent).toContain('"start_time" time NOT NULL')
    expect(migrationContent).toContain('"end_time" time NOT NULL')
  })

  it('should create time_blocks table', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('CREATE TABLE "time_blocks"')
    expect(migrationContent).toContain('"organization_id" uuid NOT NULL')
    expect(migrationContent).toContain('"date" date NOT NULL')
    expect(migrationContent).toContain('"reason" varchar(255)')
  })

  it('should add timezone to organizations', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('"timezone" text')
    expect(migrationContent).toContain("'America/Sao_Paulo'")
  })

  it('should add new columns to appointments', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('"start_datetime" timestamp with time zone NOT NULL')
    expect(migrationContent).toContain('"end_datetime" timestamp with time zone NOT NULL')
    expect(migrationContent).toContain('"management_token" uuid')
    expect(migrationContent).toContain('"reminder_sent_at" timestamp with time zone')
  })

  it('should add service_id to schedules', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('"service_id" uuid NOT NULL')
    expect(migrationContent).toContain('"is_active" boolean')
  })

  it('should create indexes', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('CREATE INDEX "time_blocks_organization_id_date_idx"')
    expect(migrationContent).toContain('CREATE INDEX "appointments_org_start_idx"')
    expect(migrationContent).toContain('CREATE INDEX "appointments_service_start_idx"')
  })

  it('should create unique constraints', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('"appointments_management_token_unique"')
    expect(migrationContent).toContain('"schedules_service_id_day_of_week_unique"')
  })

  it('should drop old columns from schedules', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('ALTER TABLE "schedules" DROP COLUMN "organization_id"')
    expect(migrationContent).toContain('ALTER TABLE "schedules" DROP COLUMN "start_time"')
    expect(migrationContent).toContain('ALTER TABLE "schedules" DROP COLUMN "end_time"')
    expect(migrationContent).toContain('ALTER TABLE "schedules" DROP COLUMN "active"')
  })

  it('should drop old columns from appointments', () => {
    const migrationPath = resolve(__dirname, '../drizzle/0004_swift_iceman.sql')
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('ALTER TABLE "appointments" DROP COLUMN "customer_id"')
    expect(migrationContent).toContain('ALTER TABLE "appointments" DROP COLUMN "start_time"')
    expect(migrationContent).toContain('ALTER TABLE "appointments" DROP COLUMN "end_time"')
  })
})

describe('Language Migration (0005)', () => {
  const migrationPath = resolve(__dirname, '../drizzle/0005_giant_groot.sql')

  it('should have generated migration file', () => {
    expect(existsSync(migrationPath)).toBe(true)
  })

  it('should add language column to appointments', () => {
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('ALTER TABLE "appointments" ADD COLUMN "language" text')
  })

  it('should add language column to organizations', () => {
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('ALTER TABLE "organizations" ADD COLUMN "language" text')
  })

  it('should have pt-BR as default value', () => {
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain("DEFAULT 'pt-BR'")
  })

  it('should have NOT NULL constraint', () => {
    const migrationContent = readFileSync(migrationPath, 'utf-8')
    expect(migrationContent).toContain('NOT NULL')
  })
})
