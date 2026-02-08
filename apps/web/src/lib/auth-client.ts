import { clientEnv } from '@schedulizer/env/client'
import { magicLinkClient, organizationClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: clientEnv.apiUrl,
  plugins: [magicLinkClient(), organizationClient()],
})

export const { signIn, signOut, useSession } = authClient

export type Session = typeof authClient.$Infer.Session
export type User = Session['user']
