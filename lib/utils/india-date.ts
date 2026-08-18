const INDIA_TIME_ZONE = "Asia/Kolkata"

export function getIndiaDateKey(value: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(value)
    .reduce<Record<string, string>>((result, part) => {
      result[part.type] = part.value
      return result
    }, {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatIndiaDateOnly(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
  },
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return ""

  // Noon prevents a date-only value from rolling to the prior day in timezones
  // west of UTC. The time is never displayed or persisted for date-only tasks.
  return new Intl.DateTimeFormat("en-IN", {
    ...options,
    timeZone: INDIA_TIME_ZONE,
  }).format(new Date(`${value}T12:00:00+05:30`))
}

export function formatIndiaTime(value?: string | null): string | null {
  if (!value) return null
  const normalized = value.slice(0, 5)
  if (!/^\d{2}:\d{2}$/.test(normalized)) return null

  const [hours, minutes] = normalized.split(":").map(Number)
  const suffix = hours >= 12 ? "PM" : "AM"
  const hour = hours % 12 || 12
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`
}

export function formatIndiaDateTime(value: string): string {
  const timestamp = new Date(value)
  if (Number.isNaN(timestamp.valueOf())) return ""

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: INDIA_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp)
}

export { INDIA_TIME_ZONE }
