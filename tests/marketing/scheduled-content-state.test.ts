import { describe, expect, it } from "vitest"

import { applyScheduledContentOutcomes, scheduledContentResultMessage } from "@/lib/marketing/scheduled-content-state"
import type { MarketingContent } from "@/lib/marketing/types"

const first = "1e149a39-7321-42d1-900c-7389c0da37a3"
const second = "b2041f1f-89e9-4a59-a8de-00169502f523"

function item(id: string, status: MarketingContent["status"]): MarketingContent {
  return {
    id, contentType: "reel", creativeDirection: "minimal", status, hashtags: [], creative: {}, composition: {}, propertySnapshot: {}, createdAt: "2026-08-11T00:00:00.000Z", updatedAt: "2026-08-11T00:00:00.000Z",
  }
}

describe("scheduled content client state", () => {
  it("removes successfully deleted scheduled cards and does not retain a stale error outcome", () => {
    const next = applyScheduledContentOutcomes([item(first, "scheduled"), item(second, "scheduled")], "delete", [{ id: first, outcome: "deleted" }])
    expect(next.map(content => content.id)).toEqual([second])
    expect(scheduledContentResultMessage("delete", [{ id: first, outcome: "deleted" }])).toBe("1 scheduled item deleted")
  })

  it("changes successfully unscheduled cards back to approved immediately", () => {
    const next = applyScheduledContentOutcomes([item(first, "scheduled")], "unschedule", [{ id: first, outcome: "unscheduled" }])
    expect(next[0]).toMatchObject({ id: first, status: "approved", proposedPublishAt: null })
    expect(scheduledContentResultMessage("unschedule", [{ id: first, outcome: "unscheduled" }])).toBe("1 scheduled item unscheduled")
  })

  it("reports partial outcomes precisely without removing protected cards", () => {
    const outcomes = [{ id: first, outcome: "deleted" }, { id: second, outcome: "skipped_publishing" }]
    const next = applyScheduledContentOutcomes([item(first, "scheduled"), item(second, "scheduled")], "delete", outcomes)
    expect(next.map(content => content.id)).toEqual([second])
    expect(scheduledContentResultMessage("delete", outcomes)).toBe("1 scheduled item deleted. 1 item skipped because publishing had already started.")
  })
})
