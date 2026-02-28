import { createHmac, timingSafeEqual } from 'node:crypto'

const SIGNATURE_PREFIX = 'sha256='

export function verifyWebhookSignature(rawBody: string, signature: string, appSecret: string): boolean {
  if (!signature.startsWith(SIGNATURE_PREFIX)) {
    return false
  }
  const expectedHash = createHmac('sha256', appSecret).update(rawBody).digest('hex')
  const receivedHash = signature.slice(SIGNATURE_PREFIX.length)
  if (expectedHash.length !== receivedHash.length) {
    return false
  }
  return timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(receivedHash, 'hex'))
}
