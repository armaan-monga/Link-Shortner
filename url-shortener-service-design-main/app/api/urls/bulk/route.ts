import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { bulkAction } from "@/lib/links"
import { errorResponse, readJson, unauthorized } from "@/lib/http"

export async function POST(request: Request) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  try {
    const { ids, action } = await readJson(request)
    return NextResponse.json({ affected: bulkAction(user.id, ids, action) })
  } catch (error) {
    return errorResponse(error)
  }
}
