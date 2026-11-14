import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { deleteLink, updateLink } from "@/lib/links"
import { errorResponse, readJson, requestHost, unauthorized } from "@/lib/http"

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  const { id } = await params
  try {
    const body = await readJson(request)
    return NextResponse.json(updateLink(user.id, id, body, requestHost(request.headers)))
  } catch (error) {
    return errorResponse(error)
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await getCurrentUser()
  if (!user) return unauthorized()
  const { id } = await params
  try {
    deleteLink(user.id, id)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return errorResponse(error)
  }
}
