import "server-only"
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto"

const globalForSecret = globalThis as unknown as { __snipSecret?: Buffer }

export function serverSecret(): Buffer {
  if (!globalForSecret.__snipSecret) {
    const configuredSecret = process.env.SNIP_SESSION_SECRET ?? process.env.SUPABASE_JWT_SECRET
    globalForSecret.__snipSecret = configuredSecret
      ? createHash("sha256").update(configuredSecret).digest()
      : randomBytes(32)
  }
  return globalForSecret.__snipSecret
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 64)
  return `${salt.toString("hex")}:${hash.toString("hex")}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":")
  if (!saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, "hex")
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length)
  return timingSafeEqual(expected, actual)
}

export function hashIp(ip: string): string {
  return createHash("sha256").update(serverSecret()).update(ip).digest("hex").slice(0, 24)
}

export function sign(value: string): string {
  return createHmac("sha256", serverSecret()).update(value).digest("base64url")
}

export function verifySignature(value: string, signature: string): boolean {
  const expected = Buffer.from(sign(value))
  const actual = Buffer.from(signature)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}
