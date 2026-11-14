
const FEATURES = [
  { name: "Custom aliases", body: "Pick a readable code. Availability is checked as you type." },
  { name: "Expiry dates", body: "Links switch off on schedule and land on a clean 410 page." },
  { name: "Click caps", body: "Limit total visits, or make a one-time link that self-destructs." },
  { name: "Passwords", body: "Hashed with scrypt. Attempts are rate-limited per IP." },
  { name: "QR codes", body: "Every link ships with a downloadable PNG, ready for print." },
  { name: "Bulk control", body: "Search, edit destinations, disable or delete in batches." },
]

export function FeatureGrid() {
  return (
    <section aria-labelledby="features" className="relative border-t border-border">
      <div className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-[1fr_1.4fr] md:px-6 md:py-28">
        <div className="flex flex-col gap-6 md:pt-64">
          <h2 id="features" className="font-display text-4xl leading-none tracking-tight md:text-5xl">
            EVERY LINK,
            <span className="block text-primary">CONTROLLED.</span>
          </h2>
          <p className="max-w-sm leading-relaxed text-muted-foreground">Rules live on the link, enforced on every single redirect.</p>
        </div>
        <ul className="grid sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <li key={feature.name} className="flex flex-col gap-3 border-t border-border py-6 sm:pr-6">
              <h3 className="font-display text-sm tracking-wide uppercase">{feature.name}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
