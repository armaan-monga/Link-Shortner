import type { CityBreakdown, CountryBreakdown } from "@/lib/types"

export const DEMO_COUNTRIES: CountryBreakdown[] = [
  { code: "US", numeric: "840", name: "United States", clicks: 30 },
  { code: "GB", numeric: "826", name: "United Kingdom", clicks: 10 },
  { code: "DE", numeric: "276", name: "Germany", clicks: 8 },
  { code: "IN", numeric: "356", name: "India", clicks: 9 },
  { code: "BR", numeric: "076", name: "Brazil", clicks: 6 },
  { code: "CA", numeric: "124", name: "Canada", clicks: 6 },
  { code: "FR", numeric: "250", name: "France", clicks: 5 },
  { code: "JP", numeric: "392", name: "Japan", clicks: 5 },
  { code: "AU", numeric: "036", name: "Australia", clicks: 4 },
  { code: "NL", numeric: "528", name: "Netherlands", clicks: 4 },
  { code: "NG", numeric: "566", name: "Nigeria", clicks: 3 },
  { code: "MX", numeric: "484", name: "Mexico", clicks: 3 },
  { code: "SG", numeric: "702", name: "Singapore", clicks: 3 },
]

export const DEMO_CITIES: CityBreakdown[] = [
  { country: "US", city: "San Francisco", latitude: 37.77, longitude: -122.42, clicks: 14 },
  { country: "US", city: "New York", latitude: 40.71, longitude: -74.0, clicks: 10 },
  { country: "GB", city: "London", latitude: 51.51, longitude: -0.13, clicks: 10 },
  { country: "IN", city: "Bengaluru", latitude: 12.97, longitude: 77.59, clicks: 9 },
  { country: "DE", city: "Berlin", latitude: 52.52, longitude: 13.4, clicks: 8 },
  { country: "BR", city: "São Paulo", latitude: -23.55, longitude: -46.63, clicks: 6 },
  { country: "CA", city: "Toronto", latitude: 43.65, longitude: -79.38, clicks: 6 },
  { country: "US", city: "Austin", latitude: 30.27, longitude: -97.74, clicks: 6 },
  { country: "FR", city: "Paris", latitude: 48.86, longitude: 2.35, clicks: 5 },
  { country: "JP", city: "Tokyo", latitude: 35.68, longitude: 139.69, clicks: 5 },
  { country: "AU", city: "Sydney", latitude: -33.87, longitude: 151.21, clicks: 4 },
  { country: "NL", city: "Amsterdam", latitude: 52.37, longitude: 4.9, clicks: 4 },
  { country: "NG", city: "Lagos", latitude: 6.52, longitude: 3.38, clicks: 3 },
  { country: "MX", city: "Mexico City", latitude: 19.43, longitude: -99.13, clicks: 3 },
  { country: "SG", city: "Singapore", latitude: 1.35, longitude: 103.82, clicks: 3 },
]
