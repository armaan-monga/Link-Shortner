import { SiteHeader } from "@/components/site-header"
import { HeroGlobe } from "@/components/hero-globe"

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-x-clip">
      <SiteHeader user={null} />
      <HeroGlobe className="pointer-events-none absolute top-24 right-[-9rem] z-0 size-[28rem] opacity-65 md:top-20 md:right-[-8rem] md:size-[38rem]" />
      <main className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-6xl items-center px-4 py-14 md:px-6 md:py-20">{children}</main>
    </div>
  )
}
