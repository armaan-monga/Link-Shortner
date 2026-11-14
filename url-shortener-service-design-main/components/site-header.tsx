import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import type { SessionUser } from "@/lib/auth"

export function SiteHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="relative z-20 border-b border-border/80 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/" className="font-display text-sm tracking-wide text-foreground md:text-base">
          SNIP <span className="text-primary">/</span> 26
        </Link>
        <nav aria-label="Account" className="flex items-center gap-1 md:gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="label-caps" nativeButton={false} render={<Link href="/dashboard" />}>
                Dashboard
              </Button>
              <span className="label-caps hidden text-muted-foreground lg:inline">{user.email}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="label-caps" nativeButton={false} render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" className="label-caps" nativeButton={false} render={<Link href="/register" />}>
                {"Get started →"}
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
