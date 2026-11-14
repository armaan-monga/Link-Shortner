"use client"

import { useState } from "react"
import Link from "next/link"
import useSWR from "swr"
import { ArrowLeft } from "lucide-react"
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { CopyButton } from "@/components/copy-button"
import { QrPanel } from "@/components/qr-panel"
import { ClickGlobe } from "@/components/click-globe"
import { displayHost, fetcher, formatDate, shortUrl } from "@/lib/client"
import type { AnalyticsResponse, Breakdown } from "@/lib/types"

const RANGES = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
]
const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const DAY = 86_400_000

export function AnalyticsView({ id }: { id: string }) {
  const [days, setDays] = useState(30)
  const [now] = useState(() => Date.now())
  const { data, error } = useSWR<AnalyticsResponse>(`/api/urls/${id}/analytics?from=${now - days * DAY}&to=${now}`, fetcher, {
    refreshInterval: 15_000,
    keepPreviousData: true,
  })

  if (error) return <p role="alert" className="text-destructive">Could not load analytics.</p>
  if (!data) return <p className="text-muted-foreground">Loading analytics…</p>

  const { link } = data
  return (
    <div className="flex flex-col gap-8">
      <Link href="/dashboard" className="label-caps flex w-fit items-center gap-2 text-muted-foreground transition-colors hover:text-primary">
        <ArrowLeft aria-hidden className="size-3.5" />
        All links
      </Link>

      <header className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="label-caps text-primary">Analytics</span>
            <span className="label-caps rounded-sm border border-border px-2 py-0.5 text-muted-foreground">{link.status}</span>
          </div>
          <h1 className="font-display text-4xl leading-none tracking-tight md:text-6xl">
            {data.totalClicks.toLocaleString()}
            <span className="block text-primary">CLICKS.</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="break-all font-display text-sm md:text-base">{displayHost(link.code)}</span>
            <CopyButton value={shortUrl(link.code)} size="icon-sm" />
          </div>
          <p className="max-w-xl truncate text-sm text-muted-foreground" title={link.longUrl}>{"→ "}{link.longUrl}</p>
          <p className="label-caps text-muted-foreground">Created {formatDate(link.createdAt)}</p>
        </div>
        <div className="rounded-lg border border-border bg-card/70 p-4 backdrop-blur-xl">
          <QrPanel value={shortUrl(link.code)} code={link.code} size={112} />
        </div>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-6 border-t border-border pt-6">
        <dl className="flex gap-10">
          <Stat label="Clicks" value={data.totalClicks} />
          <Stat label="Unique visitors" value={data.uniqueVisitors} />
          <Stat label="All-time" value={link.clicks} />
        </dl>
        <div role="group" aria-label="Date range" className="flex rounded-md border border-border bg-card p-1">
          {RANGES.map((range) => (
            <button
              key={range.label}
              type="button"
              aria-pressed={days === range.days}
              onClick={() => setDays(range.days)}
              className={`label-caps rounded-sm px-3 py-1.5 transition-colors ${days === range.days ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <Panel title="Clicks over time">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.timeseries} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
              <Tooltip
                cursor={{ stroke: "var(--chart-1)", strokeOpacity: 0.4 }}
                contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, color: "var(--foreground)" }}
              />
              <defs>
                <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="clicks" stroke="var(--chart-1)" strokeWidth={2} fill="url(#clicksFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Top referrers"><BarList items={data.referrers} total={data.totalClicks} /></Panel>
        <Panel title="Devices"><Donut items={data.devices} /></Panel>
        <Panel title="Browsers"><BarList items={data.browsers} total={data.totalClicks} /></Panel>
        <Panel title="Operating systems"><BarList items={data.os} total={data.totalClicks} /></Panel>
      </div>

      <Panel title="Click heat map">
        <ClickGlobe countries={data.countries} cities={data.cities} totalClicks={data.totalClicks} />
      </Panel>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="label-caps text-muted-foreground">{label}</dt>
      <dd className="font-display text-3xl tabular-nums">{value.toLocaleString()}</dd>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-lg border border-border bg-card/70 p-5 backdrop-blur-xl md:p-6">
      <h2 className="label-caps text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

function BarList({ items, total }: { items: Breakdown[]; total: number }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No clicks in this range.</p>
  const max = Math.max(...items.map((i) => i.clicks))
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.name} className="relative flex items-center justify-between gap-4 rounded-sm px-2 py-1.5 text-sm">
          <span aria-hidden className="absolute inset-y-0 left-0 rounded-sm border-l-2 border-primary bg-primary/10" style={{ width: `${(item.clicks / max) * 100}%` }} />
          <span className="relative truncate">{item.name}</span>
          <span className="relative tabular-nums text-muted-foreground">
            {item.clicks.toLocaleString()}
            <span className="ml-2 inline-block w-10 text-right">{total ? Math.round((item.clicks / total) * 100) : 0}%</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function Donut({ items }: { items: Breakdown[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No clicks in this range.</p>
  return (
    <div className="flex items-center gap-6">
      <div className="size-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={items} dataKey="clicks" nameKey="name" innerRadius="60%" outerRadius="100%" stroke="var(--card)" strokeWidth={2}>
              {items.map((item, index) => <Cell key={item.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, color: "var(--foreground)" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2 capitalize">
            <span aria-hidden className="size-2.5 rounded-sm" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
            {item.name}
            <span className="font-mono text-muted-foreground">{item.clicks.toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
