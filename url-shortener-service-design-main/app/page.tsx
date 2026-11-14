import { getCurrentUser } from "@/lib/auth"
import { SiteHeader } from "@/components/site-header"
import { ShortenForm } from "@/components/shorten-form"
import { RedirectPath } from "@/components/redirect-path"
import { HeroGlobe } from "@/components/hero-globe"
import { FeatureGrid } from "@/components/feature-grid"
import { SiteFooter } from "@/components/site-footer"

const STATS = [
  { label: "Index lookups", value: "1" },
  { label: "Blocking writes", value: "0", highlight: true },
  { label: "Fields per click", value: "9" },
  { label: "Cache on redirect", value: "NONE" },
]

export default async function HomePage() {
  const user = await getCurrentUser()
  return (
    <div className="relative overflow-x-clip">
      <SiteHeader user={user} />
      <main>
        <section className="relative">
          <HeroGlobe className="absolute -top-10 -right-36 z-0 size-[24rem] opacity-90 sm:size-[28rem] md:-top-14 md:-right-20 md:size-[40rem] lg:right-[-2rem] lg:size-[44rem]" />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-10 pb-16 md:px-6 md:pt-14 md:pb-24">
            <div className="flex max-w-xl items-center justify-between border-b border-border pb-4">
              <span className="label-caps text-muted-foreground">Edition 26</span>
              <span className="label-caps text-primary">Links + Analytics</span>
            </div>

            <div className="flex flex-col gap-6">
              <h1 className="animate-rise font-display text-5xl leading-none tracking-tight text-balance sm:text-7xl lg:text-8xl">
                SHORTER
                <span className="block text-primary">LINKS.</span>
              </h1>
              <p className="max-w-lg text-pretty text-base leading-relaxed text-muted-foreground md:text-lg [animation-delay:120ms] animate-rise">
                Short codes, QR, aliases, expiry, click caps and passwords. Every redirect records referrer, device, browser and country after the
                visitor has already left.
              </p>
            </div>

            <div className="max-w-3xl animate-rise [animation-delay:240ms]">
              <ShortenForm signedIn={Boolean(user)} />
              {!user && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {"Anonymous links work instantly. Demo account: "}
                  <code className="text-foreground">demo@snip.dev</code>
                  {" / "}
                  <code className="text-foreground">demo1234</code>
                </p>
              )}
            </div>

            <dl className="grid max-w-3xl grid-cols-2 gap-x-6 gap-y-8 pt-6 md:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-3 border-t border-border pt-4">
                  <dt className="label-caps text-muted-foreground">{stat.label}</dt>
                  <dd className={`font-display text-3xl md:text-4xl ${stat.highlight ? "text-primary" : "text-foreground"}`}>{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <RedirectPath />
        <FeatureGrid />
      </main>
      <SiteFooter />
    </div>
  )
}
