import { clientEnv } from '@schedulizer/env/client'

interface CheckResult {
  exists: boolean
}

export async function checkPhoneExists(phone: string): Promise<boolean> {
  const url = `${clientEnv.apiUrl}/api/auth-check/check-phone?phone=${encodeURIComponent(phone)}`
  const response = await fetch(url)
  if (!response.ok) return false
  const data: CheckResult = await response.json()
  return data.exists
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const url = `${clientEnv.apiUrl}/api/auth-check/check-email?email=${encodeURIComponent(email)}`
  const response = await fetch(url)
  if (!response.ok) return false
  const data: CheckResult = await response.json()
  return data.exists
}
