export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export async function api<T>(input: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const response = await fetch(input, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...rest.headers } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })
  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(data.error ?? "Request failed.", response.status)
  return data as T
}

export const fetcher = <T,>(url: string) => api<T>(url)

export function shortUrl(code: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin
  return `${origin}/${code}`
}

export function displayHost(code: string) {
  const host = typeof window === "undefined" ? "snip" : window.location.host
  return `${host}/${code}`
}

export function formatDate(time: number) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(time)
}
