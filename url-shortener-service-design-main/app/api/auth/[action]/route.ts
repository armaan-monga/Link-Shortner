import { NextResponse } from "next/server"
import { authenticate, createSession, destroySession, registerUser, validateCredentials } from "@/lib/auth"
import { readJson } from "@/lib/http"
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit"

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const { action } = await params

  if (action === "logout") {
    await destroySession()
    return NextResponse.json({ ok: true })
  }
  if (action !== "login" && action !== "register") {
    return NextResponse.json({ error: "Not found." }, { status: 404 })
  }

  const limit = rateLimit(`auth:${clientIp(request.headers)}`, 10, 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfter)

  const body = await readJson(request)
  const credentials = validateCredentials(body.email, body.password)
  if (typeof credentials === "string") return NextResponse.json({ error: credentials }, { status: 400 })

  if (action === "register") {
    const user = registerUser(credentials.email, credentials.password)
    if (typeof user === "string") return NextResponse.json({ error: user }, { status: 409 })
    await createSession(user.id)
    return NextResponse.json(user, { status: 201 })
  }

  const user = authenticate(credentials.email, credentials.password)
  if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 })
  await createSession(user.id)
  return NextResponse.json(user)
}
