import type { MarketingContent } from "@/lib/marketing/types"

export type ScheduledContentOutcome = {
  id: string
  outcome: string
}

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`
}

/** A user-facing summary of the database outcomes, including safe skips. */
export function scheduledContentResultMessage(action: "unschedule" | "delete", outcomes: ScheduledContentOutcome[]) {
  const successfulOutcome = action === "unschedule" ? "unscheduled" : "deleted"
  const complete = outcomes.filter(item => item.outcome === successfulOutcome).length
  const publishing = outcomes.filter(item => item.outcome === "skipped_publishing").length
  const blocked = outcomes.length - complete - publishing
  const completed = action === "unschedule"
    ? `${plural(complete, "scheduled item")} unscheduled`
    : `${plural(complete, "scheduled item")} deleted`
  const suffix = [
    publishing ? `${plural(publishing, "item")} skipped because publishing had already started` : "",
    blocked ? `${plural(blocked, "item")} skipped because ${blocked === 1 ? "it was" : "they were"} no longer safely deletable` : "",
  ].filter(Boolean).join(". ")
  return `${completed}${suffix ? `. ${suffix}.` : ""}`
}

/**
 * Mirrors a confirmed scheduled-content mutation in the client immediately.
 * The subsequent router refresh remains the source of truth, but this prevents
 * a successful action from showing stale cards or a stale selection meanwhile.
 */
export function applyScheduledContentOutcomes(
  content: MarketingContent[],
  action: "unschedule" | "delete",
  outcomes: ScheduledContentOutcome[],
) {
  const succeeded = new Set(outcomes
    .filter(item => item.outcome === (action === "unschedule" ? "unscheduled" : "deleted"))
    .map(item => item.id))

  if (action === "delete") return content.filter(item => !succeeded.has(item.id))
  return content.map(item => succeeded.has(item.id)
    ? { ...item, status: "approved" as const, proposedPublishAt: null }
    : item)
}
