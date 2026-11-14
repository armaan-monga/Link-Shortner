import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { getAnalytics } from "@/lib/links"
import { errorResponse, unauthorized } from "@/lib/http"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  const { id } = await params
  const search = new URL(request.url).searchParams
  const now = Date.now()
  const to = Number(search.get("to")) || now
  const from = Number(search.get("from")) || to - 30 * 86_400_000
  if (from > to || to - from > 366 * 86_400_000) {
    return NextResponse.json({ error: "Range must be between 0 and 366 days." }, { status: 400 })
  }
  try {
    return NextResponse.json(getAnalytics(user.id, id, from, to))
  } catch (error) {
    return errorResponse(error)
  }
}
