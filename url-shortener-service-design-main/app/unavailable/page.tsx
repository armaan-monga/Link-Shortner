import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = { title: "Link unavailable — SNIP / 26", robots: { index: false } }

const MESSAGES: Record<string, { top: string; bottom: string; body: string }> = {
  not_found: { top: "LINK NOT", bottom: "FOUND.", body: "This short link doesn't exist or has been deleted." },
  disabled: { top: "LINK", bottom: "DISABLED.", body: "The owner of this link has turned it off." },
  expired: { top: "LINK", bottom: "EXPIRED.", body: "This short link has passed its expiry date." },
  exhausted: { top: "LINK", bottom: "USED UP.", body: "This link has reached its click limit. One-time links only work once." },
}

export default async function UnavailablePage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const { reason } = await searchParams
  const key = reason && MESSAGES[reason] ? reason : "not_found"
  const message = MESSAGES[key]
  return (
    <main className="relative flex min-h-svh items-center overflow-hidden px-4 md:px-6">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6">
        <span className="label-caps text-primary">410 · {key.replace("_", " ")}</span>
        <h1 className="font-display text-5xl leading-none tracking-tight text-balance md:text-7xl">
          {message.top}
          <span className="block text-primary">{message.bottom}</span>
        </h1>
        <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">{message.body}</p>
        <Button className="label-caps h-12 w-fit px-6 text-xs" nativeButton={false} render={<Link href="/" />}>
          Shorten your own link
          <ArrowRight aria-hidden />
        </Button>
      </div>
    </main>
  )
}
