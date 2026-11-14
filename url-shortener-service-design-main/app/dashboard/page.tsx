import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { SiteHeader } from "@/components/site-header"
import { ShortenForm } from "@/components/shorten-form"
import { LinksTable } from "@/components/links-table"

export const metadata = { title: "Dashboard — SNIP / 26" }

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return (
    <div className="relative overflow-x-clip">
      <SiteHeader user={user} />
      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-14 px-4 py-12 md:px-6 md:py-16">
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="label-caps text-primary">Dashboard</span>
            <h1 className="font-display text-4xl leading-none tracking-tight md:text-6xl">
              YOUR
              <span className="block text-primary">LINKS.</span>
            </h1>
          </div>
          <div className="max-w-3xl">
            <ShortenForm signedIn />
          </div>
        </section>
        <LinksTable />
      </main>
    </div>
  )
}
