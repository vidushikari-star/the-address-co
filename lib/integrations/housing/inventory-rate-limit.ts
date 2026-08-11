const WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 60

type Entry = { count: number; resetAt: number }

const requestWindows = new Map<string, Entry>()

export function takeHousingInventoryRequest(ip: string) {
  const now = Date.now()
  const current = requestWindows.get(ip)
  const entry = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + WINDOW_MS }
    : current

  entry.count += 1
  requestWindows.set(ip, entry)

  return {
    allowed: entry.count <= MAX_REQUESTS_PER_WINDOW,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
  }
}

export function resetHousingInventoryRateLimitForTests() {
  requestWindows.clear()
}
