import "server-only"
import { cookies } from "next/headers"
import { nanoid } from "nanoid"
import { db } from "@/lib/db"
import { hashPassword, sign, verifyPassword, verifySignature } from "@/lib/crypto"

const SESSION_COOKIE = "snip_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

export type SessionUser = { id: string; email: string }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateCredentials(email: unknown, password: unknown): { email: string; password: string } | string {
  if (typeof email !== "string" || !EMAIL_PATTERN.test(email.trim()) || email.length > 254) return "Enter a valid email address."
  if (typeof password !== "string" || password.length < 8 || password.length > 128) return "Password must be 8–128 characters."
  return { email: email.trim().toLowerCase(), password }
}

export function registerUser(email: string, password: string): SessionUser | string {
  const store = db()
  if (store.emailIndex.has(email)) return "An account with that email already exists."
  const user = { id: nanoid(), email, passwordHash: hashPassword(password), createdAt: Date.now() }
  store.users.set(user.id, user)
  store.emailIndex.set(email, user.id)
  return { id: user.id, email }
}

export function authenticate(email: string, password: string): SessionUser | null {
  const store = db()
  const userId = store.emailIndex.get(email)
  const user = userId ? store.users.get(userId) : undefined
  if (!user || !verifyPassword(password, user.passwordHash)) return null
  return { id: user.id, email: user.email }
}

export async function createSession(userId: string) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const payload = `${userId}.${expires}`
  const jar = await cookies()
  jar.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function destroySession() {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const raw = jar.get(SESSION_COOKIE)?.value
  if (!raw) return null
  const [userId, expires, signature] = raw.split(".")
  if (!userId || !expires || !signature) return null
  if (!verifySignature(`${userId}.${expires}`, signature)) return null
  if (Number(expires) * 1000 < Date.now()) return null
  const user = db().users.get(userId)
  return user ? { id: user.id, email: user.email } : null
}
