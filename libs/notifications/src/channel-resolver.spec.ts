import { describe, expect, it } from 'vitest'
import { ChannelResolver } from './channel-resolver'

describe('ChannelResolver', () => {
  const resolver = new ChannelResolver()

  it('should return whatsapp when phone exists, org enabled and professional plan', () => {
    const result = resolver.resolve({
      recipientPhone: '+5511999999999',
      organizationWhatsAppEnabled: true,
      planType: 'professional',
    })
    expect(result).toBe('whatsapp')
  })

  it('should return email when no phone is provided', () => {
    const result = resolver.resolve({
      recipientPhone: undefined,
      organizationWhatsAppEnabled: true,
      planType: 'professional',
    })
    expect(result).toBe('email')
  })

  it('should return email when organization has whatsapp disabled', () => {
    const result = resolver.resolve({
      recipientPhone: '+5511999999999',
      organizationWhatsAppEnabled: false,
      planType: 'professional',
    })
    expect(result).toBe('email')
  })

  it('should return email when plan is essential (whatsapp not included)', () => {
    const result = resolver.resolve({
      recipientPhone: '+5511999999999',
      organizationWhatsAppEnabled: true,
      planType: 'essential',
    })
    expect(result).toBe('email')
  })

  it('should return email when plan type is unknown', () => {
    const result = resolver.resolve({
      recipientPhone: '+5511999999999',
      organizationWhatsAppEnabled: true,
      planType: 'unknown',
    })
    expect(result).toBe('email')
  })

  it('should return email when phone is empty string', () => {
    const result = resolver.resolve({
      recipientPhone: '',
      organizationWhatsAppEnabled: true,
      planType: 'professional',
    })
    expect(result).toBe('email')
  })
})
