import "server-only"
import { nanoid } from "nanoid"
import { hashIp, hashPassword } from "@/lib/crypto"
import type { ClickRecord, UrlRecord, User } from "@/lib/types"
import postgres from "postgres"

const sql = postgres(process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL ?? "", { prepare: false, max: 1 })
let schemaPromise: Promise<void> | null = null

export function ensurePersistentSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS snip_links (
        id text PRIMARY KEY,
        code text UNIQUE NOT NULL,
        long_url text NOT NULL,
        user_id text,
        custom_alias boolean NOT NULL DEFAULT false,
        expires_at bigint,
        password_hash text,
        click_limit integer,
        clicks integer NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at bigint NOT NULL
      )`
      await sql`CREATE INDEX IF NOT EXISTS snip_links_code_idx ON snip_links (lower(code))`
      await sql`CREATE TABLE IF NOT EXISTS snip_clicks (
        id text PRIMARY KEY,
        url_id text NOT NULL REFERENCES snip_links(id) ON DELETE CASCADE,
        timestamp bigint NOT NULL,
        referrer text NOT NULL,
        user_agent text NOT NULL,
        device text NOT NULL,
        browser text NOT NULL,
        os text NOT NULL,
        country text,
        city text,
        latitude double precision,
        longitude double precision,
        ip_hash text NOT NULL
      )`
      await sql`CREATE INDEX IF NOT EXISTS snip_clicks_url_timestamp_idx ON snip_clicks (url_id, timestamp)`
    })()
  }
  return schemaPromise
}

export async function persistUrl(url: UrlRecord) {
  await ensurePersistentSchema()
  await sql`INSERT INTO snip_links ${sql(urlToRow(url))}
    ON CONFLICT (id) DO UPDATE SET code=EXCLUDED.code, long_url=EXCLUDED.long_url,
      password_hash=EXCLUDED.password_hash, expires_at=EXCLUDED.expires_at,
      click_limit=EXCLUDED.click_limit, clicks=EXCLUDED.clicks, is_active=EXCLUDED.is_active`
}

export async function loadUrl(code: string): Promise<UrlRecord | null> {
  await ensurePersistentSchema()
  const rows = await sql`SELECT id, code, long_url, user_id, custom_alias, expires_at, password_hash, click_limit, clicks, is_active, created_at
    FROM snip_links WHERE lower(code) = lower(${code}) LIMIT 1`
  const row = rows[0]
  if (!row) return null
  return rowToUrl(row)
}

export async function persistClick(click: ClickRecord, clicks: number) {
  await ensurePersistentSchema()
  await sql.begin(async (tx) => {
    await tx`INSERT INTO snip_clicks ${tx(clickToRow(click))} ON CONFLICT (id) DO NOTHING`
    await tx`UPDATE snip_links SET clicks = ${clicks} WHERE id = ${click.urlId}`
  })
}

function urlToRow(url: UrlRecord) { return { id: url.id, code: url.code, long_url: url.longUrl, user_id: url.userId, custom_alias: url.customAlias, expires_at: url.expiresAt, password_hash: url.passwordHash, click_limit: url.clickLimit, clicks: url.clicks, is_active: url.isActive, created_at: url.createdAt } }
function rowToUrl(row: any): UrlRecord { return { id: row.id, code: row.code, longUrl: row.long_url, userId: row.user_id, customAlias: row.custom_alias, expiresAt: row.expires_at == null ? null : Number(row.expires_at), passwordHash: row.password_hash, clickLimit: row.click_limit == null ? null : Number(row.click_limit), clicks: Number(row.clicks), isActive: row.is_active, createdAt: Number(row.created_at) } }
function clickToRow(click: ClickRecord) { return { id: click.id, url_id: click.urlId, timestamp: click.timestamp, referrer: click.referrer, user_agent: click.userAgent, device: click.device, browser: click.browser, os: click.os, country: click.country, city: click.city, latitude: click.latitude, longitude: click.longitude, ip_hash: click.ipHash } }

/**
 * In-memory stand-in for MongoDB. Each Map mirrors a collection plus the index
 * the real deployment would declare:
 *   urls.code      -> unique index      (codeIndex)
 *   users.email    -> unique index      (emailIndex)
 *   clicks.urlId   -> compound index    (clicksByUrl, kept sorted by timestamp)
 * Data resets when the server process restarts.
 */
type Store = {
  users: Map<string, User>
  emailIndex: Map<string, string>
  urls: Map<string, UrlRecord>
  codeIndex: Map<string, string>
  clicksByUrl: Map<string, ClickRecord[]>
}

const STORE_VERSION = 2
const globalForStore = globalThis as unknown as { __snipStore?: Store; __snipStoreVersion?: number }

export function db(): Store {
  if (!globalForStore.__snipStore || globalForStore.__snipStoreVersion !== STORE_VERSION) {
    globalForStore.__snipStoreVersion = STORE_VERSION
    const store: Store = {
      users: new Map(),
      emailIndex: new Map(),
      urls: new Map(),
      codeIndex: new Map(),
      clicksByUrl: new Map(),
    }
    globalForStore.__snipStore = store
    seed(store)
  }
  return globalForStore.__snipStore
}

export function insertUrl(store: Store, url: UrlRecord) {
  store.urls.set(url.id, url)
  store.codeIndex.set(url.code.toLowerCase(), url.id)
  store.clicksByUrl.set(url.id, [])
}

export function removeUrl(store: Store, url: UrlRecord) {
  store.urls.delete(url.id)
  store.codeIndex.delete(url.code.toLowerCase())
  store.clicksByUrl.delete(url.id)
}

export const DEMO_EMAIL = "demo@snip.dev"
export const DEMO_PASSWORD = "demo1234"

const REFERRERS = ["Direct", "twitter.com", "news.ycombinator.com", "linkedin.com", "google.com", "reddit.com", "github.com"]
const REFERRER_WEIGHTS = [30, 18, 12, 10, 14, 9, 7]
const DEVICES = ["desktop", "mobile", "tablet"]
const DEVICE_WEIGHTS = [52, 41, 7]
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Samsung Internet"]
const BROWSER_WEIGHTS = [55, 26, 9, 7, 3]
const OSES = ["Windows", "macOS", "iOS", "Android", "Linux"]
const OS_WEIGHTS = [28, 24, 22, 20, 6]
const LOCATIONS: [string, string, number, number][] = [
  ["US", "San Francisco", 37.77, -122.42], ["US", "New York", 40.71, -74.0], ["US", "Austin", 30.27, -97.74],
  ["GB", "London", 51.51, -0.13], ["DE", "Berlin", 52.52, 13.4], ["IN", "Bengaluru", 12.97, 77.59],
  ["BR", "São Paulo", -23.55, -46.63], ["CA", "Toronto", 43.65, -79.38], ["FR", "Paris", 48.86, 2.35],
  ["JP", "Tokyo", 35.68, 139.69], ["AU", "Sydney", -33.87, 151.21], ["NL", "Amsterdam", 52.37, 4.9],
  ["NG", "Lagos", 6.52, 3.38], ["MX", "Mexico City", 19.43, -99.13], ["SG", "Singapore", 1.35, 103.82],
]
const LOCATION_WEIGHTS = [14, 10, 6, 10, 8, 9, 6, 6, 5, 5, 4, 4, 3, 3, 3]

function mulberry32(seedValue: number) {
  let a = seedValue
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seed(store: Store) {
  const now = Date.now()
  const day = 86_400_000
  const user: User = {
    id: nanoid(),
    email: DEMO_EMAIL,
    passwordHash: hashPassword(DEMO_PASSWORD),
    createdAt: now - 45 * day,
  }
  store.users.set(user.id, user)
  store.emailIndex.set(user.email, user.id)

  const rand = mulberry32(42)
  const pick = <T,>(items: T[], weights: number[]) => {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = rand() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }

  const demoLinks: { code: string; longUrl: string; custom: boolean; clicks: number; extra?: Partial<UrlRecord> }[] = [
    { code: "launch", longUrl: "https://vercel.com/blog/introducing-fluid-compute", custom: true, clicks: 640 },
    { code: "k7Qp2xA", longUrl: "https://nextjs.org/docs/app/building-your-application/caching", custom: false, clicks: 212 },
    { code: "deck", longUrl: "https://example.com/investor-deck-2026.pdf", custom: true, clicks: 38, extra: { passwordHash: hashPassword("secret") } },
    { code: "Zr4mWn9", longUrl: "https://github.com/vercel/next.js/discussions", custom: false, clicks: 0, extra: { isActive: false } },
  ]

  for (const [index, entry] of demoLinks.entries()) {
    const url: UrlRecord = {
      id: nanoid(),
      code: entry.code,
      longUrl: entry.longUrl,
      userId: user.id,
      customAlias: entry.custom,
      expiresAt: null,
      passwordHash: null,
      clickLimit: null,
      clicks: 0,
      isActive: true,
      createdAt: now - (40 - index * 6) * day,
      ...entry.extra,
    }
    insertUrl(store, url)
    const clicks = store.clicksByUrl.get(url.id)!
    for (let i = 0; i < entry.clicks; i++) {
      const ageDays = Math.pow(rand(), 1.6) * 30
      const [country, city, latitude, longitude] = pick(LOCATIONS, LOCATION_WEIGHTS)
      const device = pick(DEVICES, DEVICE_WEIGHTS)
      clicks.push({
        id: nanoid(),
        urlId: url.id,
        timestamp: now - ageDays * day,
        referrer: pick(REFERRERS, REFERRER_WEIGHTS),
        userAgent: "seed",
        device,
        browser: pick(BROWSERS, BROWSER_WEIGHTS),
        os: device === "desktop" ? pick(["Windows", "macOS", "Linux"], [50, 40, 10]) : pick(OSES.slice(2, 4), OS_WEIGHTS.slice(2, 4)),
        country,
        city,
 latitude,
 longitude,
        ipHash: hashIp(`seed-${Math.floor(rand() * entry.clicks * 0.7)}`),
      })
    }
    clicks.sort((a, b) => a.timestamp - b.timestamp)
    url.clicks = clicks.length
  }
}
