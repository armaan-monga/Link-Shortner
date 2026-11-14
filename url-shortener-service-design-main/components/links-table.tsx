"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { BarChart3, ChevronLeft, ChevronRight, Lock, Pencil, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { CopyButton } from "@/components/copy-button"
import { EditLinkDialog } from "@/components/edit-link-dialog"
import { api, fetcher, formatDate, shortUrl } from "@/lib/client"
import type { LinkListResponse, LinkStatus, PublicUrl } from "@/lib/types"

const STATUS_STYLES: Record<LinkStatus, string> = {
  active: "bg-primary text-primary-foreground",
  disabled: "border border-border text-muted-foreground",
  expired: "bg-destructive/15 text-destructive",
  exhausted: "border border-primary/40 text-primary",
}

export function LinksTable() {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<PublicUrl | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
      setPage(1)
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const key = `/api/urls?page=${page}&q=${encodeURIComponent(debouncedQuery)}`
  const { data, mutate, isLoading } = useSWR<LinkListResponse>(key, fetcher, { refreshInterval: 10_000 })
  const items = data?.items ?? []
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id))

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function runBulk(action: "enable" | "disable" | "delete") {
    if (action === "delete" && !confirm(`Delete ${selected.size} link(s)? Analytics will be lost.`)) return
    await api("/api/urls/bulk", { method: "POST", json: { ids: [...selected], action } })
    setSelected(new Set())
    mutate()
  }

  async function toggleActive(link: PublicUrl) {
    await api(`/api/urls/${link.id}`, { method: "PATCH", json: { isActive: !link.isActive } })
    mutate()
  }

  async function remove(link: PublicUrl) {
    if (!confirm(`Delete /${link.code}? Analytics will be lost.`)) return
    await api(`/api/urls/${link.id}`, { method: "DELETE" })
    mutate()
  }

  return (
    <section aria-labelledby="links-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 id="links-heading" className="flex items-baseline gap-3 font-display text-2xl tracking-tight">
          SAVED
          <span className="text-primary">{data ? data.total : ""}</span>
        </h2>
        <div className="relative md:w-80">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" aria-label="Search links" placeholder="Search code or destination" value={query} onChange={(e) => setQuery(e.target.value)} className="h-10 bg-card pl-9" />
        </div>
      </div>

      {selected.size > 0 && (
        <div role="toolbar" aria-label="Bulk actions" className="flex flex-wrap items-center gap-2 rounded-md bg-primary px-3 py-2 text-primary-foreground">
          <span className="label-caps">{selected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={() => runBulk("enable")}>Enable</Button>
          <Button size="sm" variant="secondary" onClick={() => runBulk("disable")}>Disable</Button>
          <Button size="sm" variant="secondary" className="text-destructive" onClick={() => runBulk("delete")}>Delete</Button>
          <Button size="sm" variant="ghost" className="ml-auto text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card/70 backdrop-blur-xl">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="label-caps border-b border-border text-left text-muted-foreground">
            <tr>
              <th scope="col" className="w-10 px-4 py-3">
                <Checkbox
                  aria-label="Select all on this page"
                  checked={allSelected}
                  onCheckedChange={(on) => items.forEach((item) => toggle(item.id, Boolean(on)))}
                />
              </th>
              <th scope="col" className="px-2 py-3 font-medium">Short link</th>
              <th scope="col" className="px-2 py-3 font-medium">Destination</th>
              <th scope="col" className="px-2 py-3 text-right font-medium">Clicks</th>
              <th scope="col" className="px-2 py-3 font-medium">Status</th>
              <th scope="col" className="px-2 py-3 font-medium">Created</th>
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && !data && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Loading links…</td></tr>
            )}
            {data && items.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">{debouncedQuery ? "No links match your search." : "No links yet — shorten one above."}</td></tr>
            )}
            {items.map((link) => (
              <tr key={link.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                <td className="px-4 py-3">
                  <Checkbox aria-label={`Select /${link.code}`} checked={selected.has(link.id)} onCheckedChange={(on) => toggle(link.id, Boolean(on))} />
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/dashboard/${link.id}`} className="font-display text-xs text-foreground transition-colors hover:text-primary">/{link.code}</Link>
                    {link.hasPassword && <Lock aria-label="Password protected" className="size-3.5 text-muted-foreground" />}
                    <CopyButton value={shortUrl(link.code)} size="icon-sm" />
                  </div>
                </td>
                <td className="max-w-64 truncate px-2 py-3 text-muted-foreground" title={link.longUrl}>{link.longUrl}</td>
                <td className="px-2 py-3 text-right font-mono tabular-nums">
                  {link.clicks.toLocaleString()}
                  {link.clickLimit && <span className="text-muted-foreground">/{link.clickLimit}</span>}
                </td>
                <td className="px-2 py-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(link)}
                    title={link.isActive ? "Click to disable" : "Click to enable"}
                    className={`label-caps rounded-sm px-2 py-1 ${STATUS_STYLES[link.status]}`}
                  >
                    {link.status}
                  </button>
                </td>
                <td className="px-2 py-3 whitespace-nowrap text-muted-foreground">{formatDate(link.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label={`Analytics for /${link.code}`} nativeButton={false} render={<Link href={`/dashboard/${link.id}`} />}>
                      <BarChart3 aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit /${link.code}`} onClick={() => setEditing(link)}>
                      <Pencil aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label={`Delete /${link.code}`} onClick={() => remove(link)}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-end gap-2 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft aria-hidden />Prev</Button>
          <span className="font-mono text-muted-foreground">{data.page} / {data.totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next<ChevronRight aria-hidden /></Button>
        </nav>
      )}

      <EditLinkDialog link={editing} onClose={() => setEditing(null)} onSaved={() => mutate()} />
    </section>
  )
}
