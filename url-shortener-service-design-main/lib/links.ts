import "server-only"
import { customAlphabet, nanoid } from "nanoid"
import { UAParser } from "ua-parser-js"
import countries from "i18n-iso-countries"
import { db, insertUrl, removeUrl, loadUrl, persistClick, persistUrl } from "@/lib/db"
import { hashIp, hashPassword, verifyPassword } from "@/lib/crypto"
import { checkDestination } from "@/lib/safety"
import type {
  AnalyticsResponse,
  Breakdown,
  CityBreakdown,
  ClickRecord,
  LinkListResponse,
  LinkStatus,
  PublicUrl,
  UrlRecord,
} from "@/lib/types"

const generateCode = customAlphabet("23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 7)
const ALIAS_PATTERN = /^[a-zA-Z0-9_-]{3,32}$/
const RESERVED = new Set(["api", "dashboard", "login", "register", "logout", "p", "unavailable", "_next", "static", "admin", "settings"])

export class LinkError extends Error {
  constructor(message: string, public status = 400) {
    super(message)
  }
}

export function linkStatus(url: UrlRecord, now = Date.now()): LinkStatus {
  if (!url.isActive) return "disabled"
  if (url.expiresAt !== null && url.expiresAt <= now) return "expired"
  if (url.clickLimit !== null && url.clicks >= url.clickLimit) return "exhausted"
  return "active"
}

export function toPublic(url: UrlRecord): PublicUrl {
  return {
    id: url.id,
    code: url.code,
    longUrl: url.longUrl,
    customAlias: url.customAlias,
    expiresAt: url.expiresAt,
    hasPassword: url.passwordHash !== null,
    clickLimit: url.clickLimit,
    clicks: url.clicks,
    isActive: url.isActive,
    createdAt: url.createdAt,
    status: linkStatus(url),
  }
}

function parseExpiry(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const time = typeof value === "number" ? value : Date.parse(String(value))
  if (Number.isNaN(time)) throw new LinkError("Invalid expiry date.")
  if (time <= Date.now()) throw new LinkError("Expiry date must be in the future.")
  return time
}

function parseClickLimit(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1 || limit > 1_000_000) throw new LinkError("Click limit must be a whole number between 1 and 1,000,000.")
  return limit
}

function parsePassword(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string" || value.length < 4 || value.length > 128) throw new LinkError("Password must be 4–128 characters.")
  return hashPassword(value)
}

export function isAliasAvailable(alias: string) {
  return ALIAS_PATTERN.test(alias) && !RESERVED.has(alias.toLowerCase()) && !db().codeIndex.has(alias.toLowerCase())
}

function validateAlias(alias: string) {
  if (!ALIAS_PATTERN.test(alias)) throw new LinkError("Alias must be 3–32 characters: letters, numbers, - or _.")
  if (RESERVED.has(alias.toLowerCase())) throw new LinkError("That alias is reserved.", 409)
  if (db().codeIndex.has(alias.toLowerCase())) throw new LinkError("That alias is already taken.", 409)
}

export type CreateLinkInput = {
  longUrl: unknown
  alias?: unknown
  expiresAt?: unknown
  clickLimit?: unknown
  password?: unknown
  oneTime?: unknown
}

export async function createLink(input: CreateLinkInput, userId: string | null, ownHost: string | null): Promise<PublicUrl> {
  const destination = checkDestination(input.longUrl, ownHost)
  if (!destination.ok) throw new LinkError(destination.reason, 422)

  const store = db()
  const alias = typeof input.alias === "string" ? input.alias.trim() : ""
  let code: string
  if (alias) {
    validateAlias(alias)
    code = alias
  } else {
    do code = generateCode()
    while (store.codeIndex.has(code.toLowerCase()))
  }

  const url: UrlRecord = {
    id: nanoid(),
    code,
    longUrl: destination.url,
    userId,
    customAlias: Boolean(alias),
    expiresAt: parseExpiry(input.expiresAt),
    passwordHash: parsePassword(input.password),
    clickLimit: input.oneTime === true ? 1 : parseClickLimit(input.clickLimit),
    clicks: 0,
    isActive: true,
    createdAt: Date.now(),
  }
  insertUrl(store, url)
  await persistUrl(url)
  return toPublic(url)
}

export function listLinks(userId: string, { page = 1, pageSize = 10, q = "" }: { page?: number; pageSize?: number; q?: string }): LinkListResponse {
  const needle = q.trim().toLowerCase()
  const all = [...db().urls.values()]
    .filter((url) => url.userId === userId)
    .filter((url) => !needle || url.code.toLowerCase().includes(needle) || url.longUrl.toLowerCase().includes(needle))
    .sort((a, b) => b.createdAt - a.createdAt)
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize))
  const current = Math.min(Math.max(1, page), totalPages)
  return {
    items: all.slice((current - 1) * pageSize, current * pageSize).map(toPublic),
    page: current,
    pageSize,
    total: all.length,
    totalPages,
  }
}

function getOwned(userId: string, id: string): UrlRecord {
  const url = db().urls.get(id)
  if (!url || url.userId !== userId) throw new LinkError("Link not found.", 404)
  return url
}

export type UpdateLinkInput = {
  longUrl?: unknown
  isActive?: unknown
  expiresAt?: unknown
  clickLimit?: unknown
  password?: unknown
  removePassword?: unknown
}

export function updateLink(userId: string, id: string, patch: UpdateLinkInput, ownHost: string | null): PublicUrl {
  const url = getOwned(userId, id)
  const next = { ...url }
  if (patch.longUrl !== undefined) {
    const destination = checkDestination(patch.longUrl, ownHost)
    if (!destination.ok) throw new LinkError(destination.reason, 422)
    next.longUrl = destination.url
  }
  if (patch.isActive !== undefined) next.isActive = Boolean(patch.isActive)
  if (patch.expiresAt !== undefined) next.expiresAt = parseExpiry(patch.expiresAt)
  if (patch.clickLimit !== undefined) next.clickLimit = parseClickLimit(patch.clickLimit)
  if (patch.removePassword === true) next.passwordHash = null
  else if (patch.password) next.passwordHash = parsePassword(patch.password)
  Object.assign(url, next)
  return toPublic(url)
}

export function deleteLink(userId: string, id: string) {
  removeUrl(db(), getOwned(userId, id))
}

export function bulkAction(userId: string, ids: unknown, action: unknown) {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) throw new LinkError("Select between 1 and 100 links.")
  if (action !== "enable" && action !== "disable" && action !== "delete") throw new LinkError("Unknown bulk action.")
  const store = db()
  let affected = 0
  for (const id of ids) {
    const url = typeof id === "string" ? store.urls.get(id) : undefined
    if (!url || url.userId !== userId) continue
    if (action === "delete") removeUrl(store, url)
    else url.isActive = action === "enable"
    affected++
  }
  return affected
}

export type ResolveResult =
  | { status: "ok"; url: UrlRecord }
  | { status: "password"; url: UrlRecord }
  | { status: "not_found" | "disabled" | "expired" | "exhausted" }

/** Hot path: one indexed Map lookup plus a few comparisons. */
export async function resolveCodePersistent(code: string): Promise<ResolveResult> {
  const stored = await loadUrl(code)
  if (stored) {
    const store = db()
    insertUrl(store, stored)
  }
  return resolveCode(code)
}

export function resolveCode(code: string): ResolveResult {
  const store = db()
  const id = store.codeIndex.get(code.toLowerCase())
  const url = id ? store.urls.get(id) : undefined
  if (!url) return { status: "not_found" }
  const status = linkStatus(url)
  if (status !== "active") return { status }
  if (url.passwordHash) return { status: "password", url }
  return { status: "ok", url }
}

/** Reserves a click synchronously so click limits can't be exceeded under load. */
export function reserveClick(url: UrlRecord): boolean {
  if (url.clickLimit !== null && url.clicks >= url.clickLimit) return false
  url.clicks++
  return true
}

export function verifyLinkPassword(url: UrlRecord, password: unknown) {
  return typeof password === "string" && url.passwordHash !== null && verifyPassword(password, url.passwordHash)
}

export type ClickContext = {
  userAgent: string
  referrer: string | null
  ip: string
  country: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

function referrerHost(referrer: string | null, ownHost: string | null) {
  if (!referrer) return "Direct"
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "")
    return ownHost && host === ownHost.replace(/:\d+$/, "") ? "Direct" : host
  } catch {
    return "Direct"
  }
}

/** Runs after the redirect response has been sent. */
export async function logClick(urlId: string, ctx: ClickContext, ownHost: string | null) {
  const clicks = db().clicksByUrl.get(urlId)
  if (!clicks) return
  const ua = UAParser(ctx.userAgent)
  const click: ClickRecord = {
    id: nanoid(),
    urlId,
    timestamp: Date.now(),
    referrer: referrerHost(ctx.referrer, ownHost),
    userAgent: ctx.userAgent.slice(0, 512),
    device: ua.device.type ?? "desktop",
    browser: ua.browser.name ?? "Other",
    os: ua.os.name ?? "Other",
    country: ctx.country,
    city: ctx.city,
    latitude: ctx.latitude,
    longitude: ctx.longitude,
    ipHash: hashIp(ctx.ip),
  }
  clicks.push(click)
  await persistClick(click, db().urls.get(urlId)?.clicks ?? clicks.length)
}

function tally(values: string[], limit = 8): Breakdown[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()]
    .map(([name, clicks]) => ({ name, clicks }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, limit)
}

function lowerBound(clicks: ClickRecord[], time: number) {
  let lo = 0
  let hi = clicks.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (clicks[mid].timestamp < time) lo = mid + 1
    else hi = mid
  }
  return lo
}

const regionNames = new Intl.DisplayNames(["en"], { type: "region" })

export function getAnalytics(userId: string, id: string, from: number, to: number): AnalyticsResponse {
  const url = getOwned(userId, id)
  const all = db().clicksByUrl.get(url.id) ?? []
  const clicks = all.slice(lowerBound(all, from), lowerBound(all, to + 1))

  const day = 86_400_000
  const buckets = new Map<string, number>()
  for (let t = Math.floor(from / day) * day; t <= to; t += day) {
    buckets.set(new Date(t).toISOString().slice(0, 10), 0)
  }
  for (const c of clicks) {
    const key = new Date(c.timestamp).toISOString().slice(0, 10)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  const countryCounts = tally(clicks.map((c) => c.country ?? "Unknown"), 250)

  const cityTotals = new Map<string, CityBreakdown>()
  for (const c of clicks) {
    if (!c.country || !c.city || c.latitude == null || c.longitude == null) continue
    const key = `${c.country}:${c.city}`
    const entry = cityTotals.get(key)
    if (entry) entry.clicks++
    else cityTotals.set(key, { country: c.country, city: c.city, latitude: c.latitude, longitude: c.longitude, clicks: 1 })
  }
  const cities = [...cityTotals.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 500)

  return {
    link: toPublic(url),
    range: { from, to },
    totalClicks: clicks.length,
    uniqueVisitors: new Set(clicks.map((c) => c.ipHash)).size,
    timeseries: [...buckets.entries()].map(([date, value]) => ({ date, clicks: value })),
    referrers: tally(clicks.map((c) => c.referrer)),
    devices: tally(clicks.map((c) => c.device)),
    browsers: tally(clicks.map((c) => c.browser), 6),
    os: tally(clicks.map((c) => c.os), 6),
    countries: countryCounts.map(({ name: code, clicks: value }) => ({
      code,
      numeric: code === "Unknown" ? null : (countries.alpha2ToNumeric(code) ?? null),
      name: code === "Unknown" ? "Unknown" : (regionNames.of(code) ?? code),
      clicks: value,
    })),
    cities,
  }
}
