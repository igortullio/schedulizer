import { describe, expect, it } from 'vitest'
import { ChannelResolver } from './channel-resolver'

describe('ChannelResolver', () => {
  const resolver = new ChannelResolver()

  it('should return whatsapp when phone exists and professional plan', () => {
    const result = resolver.resolve({
      recipientPhone: '+5511999999999',
      planType: 'professional',
    })
    expect(result).toBe('whatsapp')
  })

  it('should return email when no phone is provided', () => {
    const result = resolver.resolve({
      recipientPhone: undefined,
      planType: 'professional',
    })
    expect(result).toBe('email')
  })

  it('should return email when plan is essential (whatsapp not included)', () => {
    const result = resolver.resolve({
      recipientPhone: '+5511999999999',
      planType: 'essential',
    })
    expect(result).toBe('email')
  })

  it('should return email when plan type is unknown', () => {
    const result = resolver.resolve({
      recipientPhone: '+5511999999999',
      planType: 'unknown',
    })
    expect(result).toBe('email')
  })

  it('should return email when phone is empty string', () => {
    const result = resolver.resolve({
      recipientPhone: '',
      planType: 'professional',
    })
    expect(result).toBe('email')
  })
})
