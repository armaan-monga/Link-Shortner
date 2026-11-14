export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6">
        <span className="font-display text-sm">
          SNIP <span className="text-primary">/</span> 26
        </span>
        <span className="label-caps text-muted-foreground">Short links · Real analytics</span>
      </div>
    </footer>
  )
}
