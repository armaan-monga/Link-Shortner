import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { createLink, isAliasAvailable, listLinks } from "@/lib/links"
import { errorResponse, readJson, requestHost, unauthorized } from "@/lib/http"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

export async function GET(request: Request) {
  const user = await getCurrentUser()
  const params = new URL(request.url).searchParams

  const alias = params.get("alias")
  if (alias !== null) return NextResponse.json({ available: isAliasAvailable(alias) })

  if (!user) return unauthorized()
  const page = Number(params.get("page") ?? 1) || 1
  return NextResponse.json(listLinks(user.id, { page, q: params.get("q") ?? "" }))
}

export async function POST(request: Request) {
  const user = await getCurrentUser()
  const limit = rateLimit(`create:${user?.id ?? clientIp(request.headers)}`, user ? 60 : 10, 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  try {
    const body = await readJson(request)
    const link = await createLink({ ...body, longUrl: body.longUrl }, user?.id ?? null, requestHost(request.headers))
    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    return errorResponse(error)
  }
}
