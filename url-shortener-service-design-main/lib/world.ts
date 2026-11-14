import { feature } from "topojson-client"
import { geoBounds, geoCentroid } from "d3-geo"
import type { Feature, FeatureCollection, Geometry } from "geojson"
import world from "world-atlas/countries-110m.json"

export type CountryFeature = Feature<Geometry, { name: string }> & { id: string }

const topology = world as unknown as { objects: { countries: never } }
const collection = feature(world as never, topology.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>

export const COUNTRY_FEATURES: CountryFeature[] = collection.features
  .filter((item) => item.properties.name !== "Antarctica")
  .map((item) => ({
    ...item,
    id: item.id === undefined ? item.properties.name : String(item.id).padStart(3, "0"),
  }))

export type CameraTarget = { lat: number; lng: number; altitude: number }

export function viewFor(country: CountryFeature): CameraTarget {
  const [lng, lat] = geoCentroid(country)
  const [[west, south], [east, north]] = geoBounds(country)
  const lngSpan = east >= west ? east - west : east - west + 360
  const span = Math.max(lngSpan, north - south)
  return { lat, lng, altitude: Math.min(2.2, Math.max(0.45, 0.35 + span / 45)) }
}
