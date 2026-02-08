import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    stripePublishableKey: 'pk_test_123',
  },
}))

const mockLoadStripe = vi.fn()

vi.mock('@stripe/stripe-js', () => ({
  loadStripe: (key: string) => mockLoadStripe(key),
}))

describe('stripe lib', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('exports getStripePromise function', async () => {
    const { getStripePromise } = await import('./stripe')
    expect(typeof getStripePromise).toBe('function')
  })

  it('calls loadStripe with publishable key', async () => {
    const mockStripeInstance = { elements: vi.fn() }
    mockLoadStripe.mockResolvedValueOnce(mockStripeInstance)
    const { getStripePromise } = await import('./stripe')
    await getStripePromise()
    expect(mockLoadStripe).toHaveBeenCalledWith('pk_test_123')
  })

  it('returns the same promise on subsequent calls', async () => {
    const mockStripeInstance = { elements: vi.fn() }
    mockLoadStripe.mockResolvedValue(mockStripeInstance)
    const { getStripePromise } = await import('./stripe')
    const promise1 = getStripePromise()
    const promise2 = getStripePromise()
    expect(promise1).toBe(promise2)
    expect(mockLoadStripe).toHaveBeenCalledTimes(1)
  })

  it('returns Stripe instance from promise', async () => {
    const mockStripeInstance = { elements: vi.fn() }
    mockLoadStripe.mockResolvedValueOnce(mockStripeInstance)
    const { getStripePromise } = await import('./stripe')
    const stripe = await getStripePromise()
    expect(stripe).toBe(mockStripeInstance)
  })
})
