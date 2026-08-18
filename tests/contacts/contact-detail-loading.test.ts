import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { describe, expect, it, vi } from "vitest"

import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"

const root = process.cwd()

type QueryResult = { data: unknown; error: null }

function query(result: QueryResult) {
  const builder = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }

  for (const method of Object.values(builder)) method.mockReturnValue(builder)

  return Object.assign(builder, {
    then: (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  })
}

function summaryRepository(activityRows: Array<{ activity_date: string | null; created_at: string }>) {
  const propertyContacts = query({ data: [], error: null })
  const deals = query({ data: [], error: null })
  const commissions = query({ data: [], error: null })
  const activities = query({ data: activityRows, error: null })

  const from = vi.fn((table: string) => {
    if (table === "property_contacts") return propertyContacts
    if (table === "deals") return deals
    if (table === "commissions") return commissions
    if (table === "activities") return activities
    throw new Error(`Unexpected table: ${table}`)
  })

  return {
    repository: createAuthenticatedCrmReadRepository({ from } as never),
    activities,
  }
}

describe("Contact Detail server loading", () => {
  it("queries the real activity_date column for the contact summary", async () => {
    const { repository, activities } = summaryRepository([
      { activity_date: "2026-08-18T09:30:00.000Z", created_at: "2026-08-18T09:00:00.000Z" },
    ])

    await expect(repository.getContactSummary("contact-1")).resolves.toMatchObject({
      propertiesOwned: 0,
      dealsCount: 0,
      commissionGenerated: 0,
      lastActivityAt: "2026-08-18T09:30:00.000Z",
    })
    expect(activities.select).toHaveBeenCalledWith("activity_date,created_at")
  })

  it("handles contacts with no optional activity, related properties, deals, or commissions", async () => {
    const { repository } = summaryRepository([])

    await expect(repository.getContactSummary("contact-without-optional-data")).resolves.toEqual({
      propertiesOwned: 0,
      dealsCount: 0,
      closedDeals: 0,
      commissionGenerated: 0,
      lastActivityAt: undefined,
    })
  })

  it("keeps Contact Detail cookie-backed and preserves client-side C2 cards", async () => {
    const [page, detail, properties, tasks, nextAction, timeline, notes] = await Promise.all([
      readFile(join(root, "app", "(app)", "contacts", "[id]", "page.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "detail", "relationship-detail.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "detail", "relationship-properties.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "detail", "relationship-tasks.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "detail", "next-follow-up-card.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "detail", "relationship-timeline.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "detail", "relationship-notes.tsx"), "utf8"),
    ])

    expect(page).toContain("createServerSupabaseClient")
    expect(page).toContain("createAuthenticatedCrmReadRepository")
    expect(page).not.toContain("@/lib/supabase/client")
    expect(detail).toContain("<RelationshipProperties")
    expect(detail).toContain("<RelationshipTasks")
    expect(detail).toContain("<NextFollowUpCard")
    expect(detail).toContain("<RelationshipTimeline")
    expect(detail).toContain("<RelationshipNotes")
    expect(properties).toContain('"use client"')
    expect(properties).toContain("Recommended Matches")
    expect(properties).toContain("Shared Properties")
    expect(tasks).toContain('"use client"')
    expect(nextAction).toContain('"use client"')
    expect(timeline).toContain('"use client"')
    expect(notes).toContain('"use client"')
  })
})
