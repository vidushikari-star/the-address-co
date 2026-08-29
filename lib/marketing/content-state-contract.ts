import type { MarketingStatus } from "@/lib/marketing/types"

export type MarketingStateGuidance = {
  nextAction: string
  terminal: boolean
}

/**
 * The persisted status enum already expresses the M2 lifecycle. This map
 * documents actionable UI meaning without introducing a duplicate state
 * machine or a migration-only `ready_for_render` status.
 */
export const MARKETING_CONTENT_STATE_CONTRACT: Readonly<Record<MarketingStatus, MarketingStateGuidance>> = Object.freeze({
  draft: { nextAction: "Select valid media and generate editorial content.", terminal: false },
  rendering: { nextAction: "Wait for the bounded render job, or review its actionable failure.", terminal: false },
  ready_for_review: { nextAction: "Review grounded copy and deterministic rendered media, then approve or request changes.", terminal: false },
  changes_requested: { nextAction: "Edit media or copy, then render a fresh reviewable creative.", terminal: false },
  approved: { nextAction: "Schedule the validated rendered output.", terminal: false },
  scheduled: { nextAction: "Wait for the scheduled publishing job.", terminal: false },
  publishing: { nextAction: "Publishing is in progress; use publication recovery if an outcome is ambiguous.", terminal: false },
  published: { nextAction: "Published history is read-only.", terminal: true },
  blocked_connection: { nextAction: "Reconnect the Instagram account, then retry scheduling or publishing.", terminal: false },
  failed: { nextAction: "Fix the recorded media, render, or connection error and retry safely.", terminal: false },
})
