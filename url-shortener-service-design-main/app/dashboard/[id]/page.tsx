import { notFound, redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { SiteHeader } from "@/components/site-header"
import { AnalyticsView } from "@/components/analytics-view"

export const metadata = { title: "Analytics — SNIP / 26" }

export default async function LinkAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  const { id } = await params
  const url = db().urls.get(id)
  if (!url || url.userId !== user.id) notFound()
  return (
    <div className="relative overflow-x-clip">
      <SiteHeader user={user} />
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <AnalyticsView id={id} />
      </main>
    </div>
  )
}
