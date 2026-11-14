import "server-only"

const BLOCKED_HOST_PATTERNS = [
  /(^|\.)testsafebrowsing\.appspot\.com$/i,
  /(^|\.)malware\./i,
  /(^|\.)phish/i,
  /^bit\.ly$/i,
  /^tinyurl\.com$/i,
  /^t\.co$/i,
]

const PRIVATE_HOST = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/i

export type DestinationCheck = { ok: true; url: string } | { ok: false; reason: string }

/**
 * Synchronous guardrails that run on every create/edit. In production this is
 * where a Google Safe Browsing Lookup API call would be added before saving.
 */
export function checkDestination(input: unknown, ownHost: string | null): DestinationCheck {
  if (typeof input !== "string" || !input.trim()) return { ok: false, reason: "Enter a URL to shorten." }
  let raw = input.trim()
  if (raw.length > 2048) return { ok: false, reason: "URL is too long (max 2048 characters)." }
  if (!/^[a-z][a-z\d+\-.]*:\/\//i.test(raw)) raw = `https://${raw}`

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { ok: false, reason: "That doesn't look like a valid URL." }
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http and https links can be shortened." }
  }
  if (!parsed.hostname.includes(".") || PRIVATE_HOST.test(parsed.hostname)) {
    return { ok: false, reason: "Private or local addresses can't be shortened." }
  }
  if (ownHost && parsed.host.toLowerCase() === ownHost.toLowerCase()) {
    return { ok: false, reason: "Links to this shortener would create a redirect loop." }
  }
  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
    return { ok: false, reason: "This destination is blocked for safety reasons." }
  }
  return { ok: true, url: parsed.toString() }
}
