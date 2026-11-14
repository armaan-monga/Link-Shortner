"use client"

import { useMemo, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { GlobeStage } from "@/components/globe-stage"
import { COUNTRY_FEATURES } from "@/lib/world"
import type { CityBreakdown, CountryBreakdown } from "@/lib/types"

type ClickGlobeProps = {
  countries: CountryBreakdown[]
  cities: CityBreakdown[]
  totalClicks: number
}

type RankItem = { key: string; label: string; clicks: number; onSelect?: () => void }

export function ClickGlobe({ countries, cities, totalClicks }: ClickGlobeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selectedName = selectedId ? COUNTRY_FEATURES.find((f) => f.id === selectedId)?.properties.name : undefined
  const selectedCountry = selectedId ? countries.find((c) => c.numeric === selectedId) : undefined
  const selectedCities = useMemo(
    () => (selectedCountry ? cities.filter((c) => c.country === selectedCountry.code) : []),
    [cities, selectedCountry],
  )

  const countryItems: RankItem[] = countries.slice(0, 10).map((c) => ({
    key: c.code,
    label: c.name,
    clicks: c.clicks,
    onSelect: c.numeric ? () => setSelectedId(c.numeric) : undefined,
  }))
  const cityItems: RankItem[] = selectedCities.slice(0, 10).map((c) => ({ key: `${c.country}-${c.city}`, label: c.city, clicks: c.clicks }))

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="relative overflow-hidden rounded-md border border-border bg-background">
        <GlobeStage
          className="h-[380px] md:h-[500px]"
          countries={countries}
          cities={cities}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div className="pointer-events-none absolute top-4 left-4 flex flex-col gap-1">
          <span className="label-caps text-muted-foreground">{selectedId ? "Country view" : "World view"}</span>
          <span className="font-display text-xl text-foreground md:text-2xl">{selectedName ?? "ALL REGIONS"}</span>
        </div>

        {selectedId && (
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="label-caps absolute top-4 right-4 flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-foreground backdrop-blur-md transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            World
          </button>
        )}

        <div className="pointer-events-none absolute right-4 bottom-4 left-4 flex items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span
              aria-hidden
              className="h-1.5 w-28 rounded-full"
              style={{ background: "linear-gradient(90deg, rgba(200,255,61,0.2), #c8ff3d, #ffffff)" }}
            />
            <span className="label-caps flex w-28 justify-between text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </span>
          </div>
          <span className="label-caps hidden text-right text-muted-foreground sm:block">
            {selectedId ? "Bars are cities" : "Drag to rotate. Click a country."}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {selectedId ? (
          <>
            <dl className="grid grid-cols-3 gap-4 border-b border-border pb-5">
              <Metric label="Clicks" value={(selectedCountry?.clicks ?? 0).toLocaleString()} />
              <Metric label="Share" value={`${totalClicks && selectedCountry ? Math.round((selectedCountry.clicks / totalClicks) * 100) : 0}%`} />
              <Metric label="Cities" value={String(selectedCities.length)} />
            </dl>
            <h3 className="label-caps text-muted-foreground">Top cities in {selectedName}</h3>
            {cityItems.length > 0 ? (
              <RankList items={cityItems} total={selectedCountry?.clicks ?? 0} />
            ) : (
              <p className="text-sm text-muted-foreground">
                {selectedCountry ? "No city-level data for this country in the selected range." : "No clicks from this country in the selected range."}
              </p>
            )}
          </>
        ) : (
          <>
            <h3 className="label-caps text-muted-foreground">Top countries</h3>
            {countryItems.length > 0 ? (
              <RankList items={countryItems} total={totalClicks} />
            ) : (
              <p className="text-sm text-muted-foreground">No clicks in this range.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2">
      <dt className="label-caps text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl tabular-nums">{value}</dd>
    </div>
  )
}

function RankList({ items, total }: { items: RankItem[]; total: number }) {
  const max = Math.max(...items.map((i) => i.clicks))
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const row = (
          <>
            <span aria-hidden className="absolute inset-y-0 left-0 rounded-sm border-l-2 border-primary bg-primary/10" style={{ width: `${(item.clicks / max) * 100}%` }} />
            <span className="relative truncate">{item.label}</span>
            <span className="relative tabular-nums text-muted-foreground">
              {item.clicks.toLocaleString()}
              <span className="ml-2 inline-block w-10 text-right">{total ? Math.round((item.clicks / total) * 100) : 0}%</span>
            </span>
          </>
        )
        const className = "relative flex w-full items-center justify-between gap-4 rounded-sm px-2 py-2 text-left text-sm"
        return (
          <li key={item.key}>
            {item.onSelect ? (
              <button type="button" onClick={item.onSelect} className={`${className} transition-colors hover:bg-secondary`}>
                {row}
              </button>
            ) : (
              <div className={className}>{row}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
