"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Globe, { type GlobeMethods } from "react-globe.gl"
import { COUNTRY_FEATURES, viewFor, type CountryFeature } from "@/lib/world"
import type { CityBreakdown, CountryBreakdown } from "@/lib/types"

export type GlobeCanvasProps = {
  width: number
  height: number
  countries: CountryBreakdown[]
  cities: CityBreakdown[]
  selectedId: string | null
  onSelect?: (id: string | null) => void
  autoRotate?: boolean
  altitude?: number
}

const LIME = "#c8ff3d"
const TOOLTIP =
  "font:12px Geist,system-ui,sans-serif;padding:6px 10px;background:#0f0f0f;border:1px solid #232323;border-radius:4px;color:#ededea;line-height:1.5"

function heatColor(t: number) {
  if (t < 0.04) return "rgba(200,255,61,0)"
  if (t < 0.55) return `rgba(200,255,61,${(0.12 + t * 0.9).toFixed(2)})`
  const u = (t - 0.55) / 0.45
  return `rgba(${Math.round(200 + 55 * u)},255,${Math.round(61 + 194 * u)},${(0.62 + 0.38 * u).toFixed(2)})`
}

export default function GlobeCanvas({
  width,
  height,
  countries,
  cities,
  selectedId,
  onSelect,
  autoRotate = true,
  altitude = 2.2,
}: GlobeCanvasProps) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const interactive = Boolean(onSelect)

  const byId = useMemo(() => new Map(countries.filter((c) => c.numeric).map((c) => [c.numeric as string, c])), [countries])
  const maxCountry = Math.max(1, ...countries.map((c) => c.clicks))
  const selectedCountry = selectedId ? byId.get(selectedId) : undefined

  const visibleCities = useMemo(
    () => (selectedId ? cities.filter((c) => c.country === selectedCountry?.code) : cities),
    [cities, selectedId, selectedCountry?.code],
  )
  const maxCity = Math.max(1, ...visibleCities.map((c) => c.clicks))
  const heatmaps = useMemo(() => [{ points: visibleCities }], [visibleCities])
  const rings = useMemo(() => visibleCities.slice(0, selectedId ? 10 : 6), [visibleCities, selectedId])

  const applyView = useCallback(
    (duration: number) => {
      const globe = globeRef.current
      if (!globe) return
      const country = selectedId ? COUNTRY_FEATURES.find((f) => f.id === selectedId) : undefined
      globe.pointOfView(country ? viewFor(country) : { lat: 18, lng: 10, altitude }, duration)
      const controls = globe.controls()
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      controls.autoRotate = autoRotate && !selectedId && !reduceMotion
      controls.autoRotateSpeed = 0.55
      controls.enableZoom = false
    },
    [selectedId, autoRotate, altitude],
  )

  useEffect(() => {
    applyView(1400)
  }, [applyView])

  const onReady = useCallback(() => {
    if (!globeRef.current) return
    applyView(0)
  }, [applyView])

  return (
    <div style={{ cursor: interactive && hoverId ? "pointer" : "grab" }}>
      <Globe
        ref={globeRef}
        width={width}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        onGlobeReady={onReady}
        showAtmosphere
        atmosphereColor={LIME}
        atmosphereAltitude={0.14}
        showGraticules
        polygonsData={COUNTRY_FEATURES}
        polygonAltitude={(d) => ((d as CountryFeature).id === selectedId ? 0.01 : 0.004)}
        polygonCapColor={(d) => {
          const feature = d as CountryFeature
          if (feature.id === selectedId) return "rgba(200,255,61,0.4)"
          if (feature.id === hoverId && interactive) return "rgba(237,237,234,0.3)"
          if (selectedId) return "rgba(18,18,18,0.92)"
          const entry = byId.get(feature.id)
          if (entry) return `rgba(200,255,61,${(0.1 + 0.3 * Math.sqrt(entry.clicks / maxCountry)).toFixed(2)})`
          return "rgba(28,28,28,0.95)"
        }}
        polygonSideColor={() => "rgba(200,255,61,0.1)"}
        polygonStrokeColor={(d) => ((d as CountryFeature).id === selectedId ? LIME : "#2f2f2f")}
        polygonsTransitionDuration={0}
        polygonLabel={(d) => {
          const feature = d as CountryFeature
          const entry = byId.get(feature.id)
          return `<div style="${TOOLTIP}"><b>${feature.properties.name}</b><br/><span style="color:${LIME}">${
            entry ? `${entry.clicks.toLocaleString()} clicks` : "No clicks"
          }</span></div>`
        }}
        onPolygonHover={(d) => setHoverId(d ? (d as CountryFeature).id : null)}
        onPolygonClick={(d) => {
          if (!onSelect) return
          const id = (d as CountryFeature).id
          onSelect(id === selectedId ? null : id)
        }}
        heatmapsData={heatmaps}
        heatmapPoints="points"
        heatmapPointLat="latitude"
        heatmapPointLng="longitude"
        heatmapPointWeight="clicks"
        heatmapBandwidth={selectedId ? 0.9 : 2.6}
        heatmapColorFn={() => heatColor}
        heatmapColorSaturation={1.6}
        heatmapBaseAltitude={0.016}
        heatmapTopAltitude={selectedId ? 0.1 : 0.2}
        heatmapsTransitionDuration={0}
        ringsData={rings}
        ringLat="latitude"
        ringLng="longitude"
        ringColor={() => (t: number) => `rgba(200,255,61,${(1 - t).toFixed(2)})`}
        ringMaxRadius={selectedId ? 1.4 : 3.2}
        ringPropagationSpeed={1.6}
        ringRepeatPeriod={2200}
        pointsData={selectedId ? visibleCities : []}
        pointLat="latitude"
        pointLng="longitude"
        pointAltitude={(d) => 0.02 + 0.16 * ((d as CityBreakdown).clicks / maxCity)}
        pointRadius={0.28}
        pointColor={() => LIME}
        pointLabel={(d) => {
          const city = d as CityBreakdown
          return `<div style="${TOOLTIP}"><b>${city.city}</b><br/><span style="color:${LIME}">${city.clicks.toLocaleString()} clicks</span></div>`
        }}
      />
    </div>
  )
}
