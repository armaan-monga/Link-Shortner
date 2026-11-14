import { after, NextResponse } from "next/server"
import { logClick, reserveClick, resolveCode, verifyLinkPassword } from "@/lib/links"
import { clickContext, readJson, requestHost } from "@/lib/http"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

/** The `id` segment is the public short code for this endpoint. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: code } = await params
  const limit = rateLimit(`verify:${code}:${clientIp(request.headers)}`, 5, 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const result = resolveCode(code)
  if (result.status === "ok") return NextResponse.json({ url: `/${result.url.code}` })
  if (result.status !== "password") return NextResponse.json({ error: "This link is no longer available." }, { status: 410 })

  const { password } = await readJson(request)
  if (!verifyLinkPassword(result.url, password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
  }
  if (!reserveClick(result.url)) return NextResponse.json({ error: "This link has reached its click limit." }, { status: 410 })

  const ctx = clickContext(request.headers)
  const host = requestHost(request.headers)
  const urlId = result.url.id
  after(() => logClick(urlId, ctx, host))
  return NextResponse.json({ url: result.url.longUrl })
}
