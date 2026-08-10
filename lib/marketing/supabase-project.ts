/** A non-secret identifier used only to confirm worker and API queue alignment. */
export function supabaseProjectRef(value = process.env.NEXT_PUBLIC_SUPABASE_URL) {
  if (!value) return null
  try {
    const hostname = new URL(value).hostname
    return hostname.endsWith(".supabase.co") ? hostname.split(".")[0] ?? null : hostname
  } catch {
    return null
  }
}
