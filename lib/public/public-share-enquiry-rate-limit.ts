const WINDOW_MS = 15 * 60 * 1000
const MAX_REQUESTS = 5

const attempts = new Map<string, number[]>()

export function takePublicShareEnquiryRequest(key: string, now = Date.now()) {
  const recent = (attempts.get(key) ?? []).filter(attempt => now - attempt < WINDOW_MS)
  if (recent.length >= MAX_REQUESTS) {
    attempts.set(key, recent)
    return false
  }

  recent.push(now)
  attempts.set(key, recent)
  return true
}

export function resetPublicShareEnquiryRateLimitForTests() {
  attempts.clear()
}
