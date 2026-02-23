import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseSession = vi.fn()
const mockSignIn = { magicLink: vi.fn() }
const mockSignOut = vi.fn()

vi.mock('better-auth/react', () => ({
  createAuthClient: vi.fn(() => ({
    useSession: mockUseSession,
    signIn: mockSignIn,
    signOut: mockSignOut,
    $Infer: { Session: {} as { user: { id: string; email: string } } },
  })),
}))

vi.mock('better-auth/client/plugins', () => ({
  magicLinkClient: vi.fn(() => ({ id: 'magic-link-client' })),
  organizationClient: vi.fn(() => ({ id: 'organization-client' })),
  phoneNumberClient: vi.fn(() => ({ id: 'phone-number-client' })),
}))

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
    turnstileSiteKey: undefined,
  },
}))

describe('auth-client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('exports', () => {
    it('should export authClient instance', async () => {
      const { authClient } = await import('./auth-client')
      expect(authClient).toBeDefined()
      expect(authClient).toHaveProperty('useSession')
      expect(authClient).toHaveProperty('signIn')
      expect(authClient).toHaveProperty('signOut')
    })

    it('should export signIn method with magicLink', async () => {
      const { signIn } = await import('./auth-client')
      expect(signIn).toBeDefined()
      expect(signIn.magicLink).toBeDefined()
      expect(typeof signIn.magicLink).toBe('function')
    })

    it('should export signOut method', async () => {
      const { signOut } = await import('./auth-client')
      expect(signOut).toBeDefined()
    })

    it('should export useSession hook', async () => {
      const { useSession } = await import('./auth-client')
      expect(useSession).toBeDefined()
      expect(typeof useSession).toBe('function')
    })
  })

  describe('functionality', () => {
    it('should call useSession when hook is invoked', async () => {
      const { useSession } = await import('./auth-client')
      useSession()
      expect(mockUseSession).toHaveBeenCalled()
    })

    it('should call signIn.magicLink when method is invoked', async () => {
      const { signIn } = await import('./auth-client')
      signIn.magicLink({ email: 'test@example.com' })
      expect(mockSignIn.magicLink).toHaveBeenCalledWith({ email: 'test@example.com' })
    })

    it('should call signOut when method is invoked', async () => {
      const { signOut } = await import('./auth-client')
      signOut()
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('types', () => {
    it('should export Session type through authClient.$Infer', async () => {
      const { authClient } = await import('./auth-client')
      expect(authClient.$Infer).toBeDefined()
      expect(authClient.$Infer.Session).toBeDefined()
    })
  })
})
