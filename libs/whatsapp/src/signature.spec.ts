import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { verifyWebhookSignature } from './signature'

const APP_SECRET = 'test_app_secret_key'

function createValidSignature(body: string): string {
  const hash = createHmac('sha256', APP_SECRET).update(body).digest('hex')
  return `sha256=${hash}`
}

describe('verifyWebhookSignature', () => {
  const rawBody = '{"object":"whatsapp_business_account","entry":[]}'

  it('should return true for a valid signature', () => {
    const signature = createValidSignature(rawBody)
    expect(verifyWebhookSignature(rawBody, signature, APP_SECRET)).toBe(true)
  })

  it('should return false for an invalid signature', () => {
    expect(
      verifyWebhookSignature(rawBody, 'sha256=invalid_hash_value_here_1234567890abcdef1234567890abcdef', APP_SECRET),
    ).toBe(false)
  })

  it('should return false when signature has no sha256= prefix', () => {
    const hash = createHmac('sha256', APP_SECRET).update(rawBody).digest('hex')
    expect(verifyWebhookSignature(rawBody, hash, APP_SECRET)).toBe(false)
  })

  it('should return false for empty signature', () => {
    expect(verifyWebhookSignature(rawBody, '', APP_SECRET)).toBe(false)
  })

  it('should return false when body is tampered', () => {
    const signature = createValidSignature(rawBody)
    const tamperedBody = '{"object":"whatsapp_business_account","entry":[{"id":"tampered"}]}'
    expect(verifyWebhookSignature(tamperedBody, signature, APP_SECRET)).toBe(false)
  })

  it('should return false for different app secret', () => {
    const signature = createValidSignature(rawBody)
    expect(verifyWebhookSignature(rawBody, signature, 'different_secret')).toBe(false)
  })
})
