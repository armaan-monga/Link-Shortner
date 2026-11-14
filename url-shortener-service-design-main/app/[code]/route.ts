import { after, NextResponse } from "next/server"
import { logClick, reserveClick, resolveCodePersistent } from "@/lib/links"
import { clickContext, requestHost } from "@/lib/http"

const NO_STORE = { "Cache-Control": "private, no-store" }

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const result = await resolveCodePersistent(code)

  if (result.status === "password") {
    return NextResponse.redirect(new URL(`/p/${encodeURIComponent(result.url.code)}`, request.url), { status: 302, headers: NO_STORE })
  }
  if (result.status !== "ok" || !reserveClick(result.url)) {
    const reason = result.status === "ok" ? "exhausted" : result.status
    return NextResponse.redirect(new URL(`/unavailable?reason=${reason}`, request.url), { status: 302, headers: NO_STORE })
  }

  const ctx = clickContext(request.headers)
  const host = requestHost(request.headers)
  const urlId = result.url.id
  after(() => logClick(urlId, ctx, host))

  return NextResponse.redirect(result.url.longUrl, { status: 302, headers: NO_STORE })
}
