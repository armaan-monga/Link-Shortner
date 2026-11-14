const STEPS = [
  { label: "GET /k7Qp2xA", detail: "Request hits the redirect route. No page render, no auth, no body parsing." },
  { label: "Code index", detail: "One unique-index read by code. Disabled, expiry and click-cap checks are in-memory comparisons." },
  { label: "302 Location", detail: "The visitor is redirected immediately with Cache-Control: no-store so every click counts.", sent: true },
  { label: "after() log", detail: "Referrer, user agent, device, browser and geo headers are parsed once the response is flushed." },
]

export function RedirectPath() {
  return (
    <section aria-labelledby="hot-path" className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 md:px-6 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <h2 id="hot-path" className="font-display text-4xl leading-none tracking-tight md:text-6xl">
            THE HOT
            <span className="block text-primary">PATH.</span>
          </h2>
          <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
            The redirect is the only request that has to be fast. Everything slow happens after the visitor has gone.
          </p>
        </div>

        <ol className="grid border-t border-border md:grid-cols-4">
          {STEPS.map((step, index) => (
            <li
              key={step.label}
              className="group flex flex-col gap-4 border-b border-border py-6 transition-colors hover:bg-card md:border-b-0 md:border-l md:px-5 md:first:border-l-0 md:first:pl-0"
            >
              <span className="label-caps text-muted-foreground">Step {index + 1}</span>
              <span className={`font-display text-lg ${step.sent ? "text-primary" : "text-foreground"}`}>{step.label}</span>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
              {step.sent && (
                <span className="label-caps mt-auto w-fit rounded-sm bg-primary px-2 py-1 text-primary-foreground">Response sent</span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
