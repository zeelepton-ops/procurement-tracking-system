import crypto from 'crypto'

function getKey(): Buffer | null {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) return null
  // Derive a 32-byte key from the secret
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(plainText: string): string {
  const key = getKey()
  if (!key) throw new Error('ENCRYPTION_KEY is not set')

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export function decryptSecret(payload?: string | null): string | null {
  if (!payload) return null

  const key = getKey()
  if (!key) return null

  const [ivB64, tagB64, dataB64] = payload.split(':')
  if (!ivB64 || !tagB64 || !dataB64) return null

  try {
    const iv = Buffer.from(ivB64, 'base64')
    const authTag = Buffer.from(tagB64, 'base64')
    const encrypted = Buffer.from(dataB64, 'base64')

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Failed to decrypt secret', error)
    return null
  }
}
