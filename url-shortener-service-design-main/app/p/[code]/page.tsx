import { redirect } from "next/navigation"
import { resolveCode } from "@/lib/links"
import { PasswordForm } from "@/components/password-form"

export const metadata = { title: "Protected link — SNIP / 26", robots: { index: false } }

export default async function ProtectedLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const result = resolveCode(code)
  if (result.status === "ok") redirect(`/${result.url.code}`)
  if (result.status !== "password") redirect(`/unavailable?reason=${result.status}`)

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-16">
      <div className="relative z-10 w-full max-w-sm">
        <PasswordForm code={result.url.code} />
      </div>
    </main>
  )
}
