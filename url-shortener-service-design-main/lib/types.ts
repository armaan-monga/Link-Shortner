export type User = {
  id: string
  email: string
  passwordHash: string
  createdAt: number
}

export type UrlRecord = {
  id: string
  code: string
  longUrl: string
  userId: string | null
  customAlias: boolean
  expiresAt: number | null
  passwordHash: string | null
  clickLimit: number | null
  clicks: number
  isActive: boolean
  createdAt: number
}

export type ClickRecord = {
  id: string
  urlId: string
  timestamp: number
  referrer: string
  userAgent: string
  device: string
  browser: string
  os: string
  country: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  ipHash: string
}

export type PublicUrl = {
  id: string
  code: string
  longUrl: string
  customAlias: boolean
  expiresAt: number | null
  hasPassword: boolean
  clickLimit: number | null
  clicks: number
  isActive: boolean
  createdAt: number
  status: LinkStatus
}

export type LinkStatus = "active" | "disabled" | "expired" | "exhausted"

export type LinkListResponse = {
  items: PublicUrl[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type Breakdown = { name: string; clicks: number }

export type CountryBreakdown = {
  code: string
  numeric: string | null
  name: string
  clicks: number
}

export type CityBreakdown = {
  country: string
  city: string
  latitude: number
  longitude: number
  clicks: number
}

export type AnalyticsResponse = {
  link: PublicUrl
  range: { from: number; to: number }
  totalClicks: number
  uniqueVisitors: number
  timeseries: { date: string; clicks: number }[]
  referrers: Breakdown[]
  devices: Breakdown[]
  browsers: Breakdown[]
  os: Breakdown[]
  countries: CountryBreakdown[]
  cities: CityBreakdown[]
}
