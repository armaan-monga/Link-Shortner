import "server-only"
import { NextResponse } from "next/server"
import { LinkError, type ClickContext } from "@/lib/links"
import { clientIp } from "@/lib/rate-limit"

export function requestHost(headers: Headers): string | null {
  return headers.get("x-forwarded-host") ?? headers.get("host")
}

export function clickContext(headers: Headers): ClickContext {
  const city = headers.get("x-vercel-ip-city")
  const latitude = Number.parseFloat(headers.get("x-vercel-ip-latitude") ?? "")
  const longitude = Number.parseFloat(headers.get("x-vercel-ip-longitude") ?? "")
  return {
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    userAgent: headers.get("user-agent") ?? "",
    referrer: headers.get("referer"),
    ip: clientIp(headers),
    country: headers.get("x-vercel-ip-country"),
    city: city ? decodeURIComponent(city) : null,
  }
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    return body && typeof body === "object" ? body : {}
  } catch {
    return {}
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof LinkError) return NextResponse.json({ error: error.message }, { status: error.status })
  console.error("[snip] unexpected error", error)
  return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
}

export function unauthorized() {
  return NextResponse.json({ error: "Sign in required." }, { status: 401 })
}
