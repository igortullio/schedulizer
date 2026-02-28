import { describe, expect, it, vi } from 'vitest'

vi.mock('dotenv/config', () => ({}))

const validBaseEnv = {
  DATABASE_URL: 'https://localhost:5432/schedulizer',
  SERVER_PORT: '3000',
  BETTER_AUTH_SECRET: 'a-super-secret-key-at-least-32-characters-long',
  BETTER_AUTH_URL: 'http://localhost:3000',
  FRONTEND_URL: 'http://localhost:4200',
  RESEND_API_KEY: 're_test_key',
  STRIPE_SECRET_KEY: 'sk_test_key',
  STRIPE_WEBHOOK_SECRET: 'whsec_test_secret',
  CRON_API_KEY: 'cron-api-key-at-least-16',
  STRIPE_PRICE_ESSENTIAL_MONTHLY: 'price_essential_monthly',
  STRIPE_PRICE_ESSENTIAL_YEARLY: 'price_essential_yearly',
  STRIPE_PRICE_PROFESSIONAL_MONTHLY: 'price_professional_monthly',
  STRIPE_PRICE_PROFESSIONAL_YEARLY: 'price_professional_yearly',
  WHATSAPP_PHONE_NUMBER_ID: '123456789',
  WHATSAPP_ACCESS_TOKEN: 'EAAxxxxxxxx',
  WHATSAPP_VERIFY_TOKEN: 'my-verify-token',
  WHATSAPP_APP_SECRET: 'app-secret-value',
}

vi.stubEnv('DATABASE_URL', validBaseEnv.DATABASE_URL)
vi.stubEnv('SERVER_PORT', validBaseEnv.SERVER_PORT)
vi.stubEnv('BETTER_AUTH_SECRET', validBaseEnv.BETTER_AUTH_SECRET)
vi.stubEnv('BETTER_AUTH_URL', validBaseEnv.BETTER_AUTH_URL)
vi.stubEnv('FRONTEND_URL', validBaseEnv.FRONTEND_URL)
vi.stubEnv('RESEND_API_KEY', validBaseEnv.RESEND_API_KEY)
vi.stubEnv('STRIPE_SECRET_KEY', validBaseEnv.STRIPE_SECRET_KEY)
vi.stubEnv('STRIPE_WEBHOOK_SECRET', validBaseEnv.STRIPE_WEBHOOK_SECRET)
vi.stubEnv('CRON_API_KEY', validBaseEnv.CRON_API_KEY)
vi.stubEnv('STRIPE_PRICE_ESSENTIAL_MONTHLY', validBaseEnv.STRIPE_PRICE_ESSENTIAL_MONTHLY)
vi.stubEnv('STRIPE_PRICE_ESSENTIAL_YEARLY', validBaseEnv.STRIPE_PRICE_ESSENTIAL_YEARLY)
vi.stubEnv('STRIPE_PRICE_PROFESSIONAL_MONTHLY', validBaseEnv.STRIPE_PRICE_PROFESSIONAL_MONTHLY)
vi.stubEnv('STRIPE_PRICE_PROFESSIONAL_YEARLY', validBaseEnv.STRIPE_PRICE_PROFESSIONAL_YEARLY)
vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', validBaseEnv.WHATSAPP_PHONE_NUMBER_ID)
vi.stubEnv('WHATSAPP_ACCESS_TOKEN', validBaseEnv.WHATSAPP_ACCESS_TOKEN)
vi.stubEnv('WHATSAPP_VERIFY_TOKEN', validBaseEnv.WHATSAPP_VERIFY_TOKEN)
vi.stubEnv('WHATSAPP_APP_SECRET', validBaseEnv.WHATSAPP_APP_SECRET)

const { serverEnvSchema } = await import('./server')

describe('serverEnvSchema - WhatsApp variables', () => {
  it('should accept valid string values for all 4 WhatsApp variables', () => {
    const result = serverEnvSchema.safeParse(validBaseEnv)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.WHATSAPP_PHONE_NUMBER_ID).toBe('123456789')
      expect(result.data.WHATSAPP_ACCESS_TOKEN).toBe('EAAxxxxxxxx')
      expect(result.data.WHATSAPP_VERIFY_TOKEN).toBe('my-verify-token')
      expect(result.data.WHATSAPP_APP_SECRET).toBe('app-secret-value')
    }
  })

  it('should reject when WHATSAPP_PHONE_NUMBER_ID is missing', () => {
    const { WHATSAPP_PHONE_NUMBER_ID: _, ...env } = validBaseEnv
    const result = serverEnvSchema.safeParse(env)
    expect(result.success).toBe(false)
  })

  it('should reject when WHATSAPP_ACCESS_TOKEN is missing', () => {
    const { WHATSAPP_ACCESS_TOKEN: _, ...env } = validBaseEnv
    const result = serverEnvSchema.safeParse(env)
    expect(result.success).toBe(false)
  })

  it('should reject when WHATSAPP_VERIFY_TOKEN is missing', () => {
    const { WHATSAPP_VERIFY_TOKEN: _, ...env } = validBaseEnv
    const result = serverEnvSchema.safeParse(env)
    expect(result.success).toBe(false)
  })

  it('should reject when WHATSAPP_APP_SECRET is missing', () => {
    const { WHATSAPP_APP_SECRET: _, ...env } = validBaseEnv
    const result = serverEnvSchema.safeParse(env)
    expect(result.success).toBe(false)
  })

  it('should reject when any WhatsApp variable is an empty string', () => {
    for (const key of [
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_VERIFY_TOKEN',
      'WHATSAPP_APP_SECRET',
    ] as const) {
      const env = { ...validBaseEnv, [key]: '' }
      const result = serverEnvSchema.safeParse(env)
      expect(result.success, `expected ${key} to reject empty string`).toBe(false)
    }
  })

  it('should return correct camelCase properties from createServerEnv', async () => {
    const { serverEnv } = await import('./server')
    expect(serverEnv.whatsappPhoneNumberId).toBe('123456789')
    expect(serverEnv.whatsappAccessToken).toBe('EAAxxxxxxxx')
    expect(serverEnv.whatsappVerifyToken).toBe('my-verify-token')
    expect(serverEnv.whatsappAppSecret).toBe('app-secret-value')
  })
})
