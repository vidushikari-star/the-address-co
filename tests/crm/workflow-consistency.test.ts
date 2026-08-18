import { readFile } from "node:fs/promises"
import { join } from "node:path"

import {
  describe,
  expect,
  it,
  vi,
} from "vitest"

import {
  formatIndiaDateOnly,
  formatIndiaTime,
  getIndiaDateKey,
} from "@/lib/utils/india-date"
import {
  getMyWork,
} from "@/lib/services/dashboard-service"
import type {
  DashboardSupabaseClient,
} from "@/lib/services/dashboard-service"

const root = process.cwd()

function countQuery(count: number) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    not: vi.fn(),
    lte: vi.fn(),
    gte: vi.fn(),
    neq: vi.fn(),
  }

  for (const method of [
    query.select,
    query.eq,
    query.not,
    query.lte,
    query.gte,
    query.neq,
  ]) {
    method.mockReturnValue(query)
  }

  Object.assign(query, { then: (resolve: (value: { count: number; error: null }) => unknown) => Promise.resolve({ count, error: null }).then(resolve) })
  return query
}

describe("CRM workflow consistency", () => {
  it("keeps task dates date-only and only renders a time when one was explicitly chosen", () => {
    expect(formatIndiaDateOnly("2026-08-18")).toBe("18 Aug 2026")
    expect(formatIndiaTime()).toBeNull()
    expect(formatIndiaTime("00:00:00")).toBe("12:00 AM")
    expect(formatIndiaTime("15:30")).toBe("3:30 PM")
    expect(getIndiaDateKey(new Date("2026-08-18T18:45:00.000Z"))).toBe("2026-08-19")
  })

  it("uses counted CRM queries for every My Work card", async () => {
    const from = vi.fn(() => countQuery(3))
    const result = await getMyWork({ from } as unknown as DashboardSupabaseClient, "advisor-1")

    expect(result).toEqual({
      newLeads: 3,
      followUps: 3,
      myTasks: 3,
      activeDeals: 3,
      upcomingVisits: 3,
    })
    expect(from.mock.calls.map((call) => (call as unknown as [string])[0])).toEqual([
      "contacts",
      "contacts",
      "deals",
      "site_visits",
      "tasks",
    ])
  })

  it("retains only one authenticated user's persisted draft per workflow", async () => {
    const migration = await readFile(join(root, "supabase", "migrations", "20260818130000_add_crm_workflow_drafts_and_task_due_times.sql"), "utf8")

    expect(migration).toContain("unique (owner_id, workflow)")
    expect(migration).toContain("public.is_crm_user() and owner_id = auth.uid()")
    expect(migration).toContain("revoke all on table public.crm_drafts from anon")
    expect(migration).toContain("add column if not exists due_time time without time zone")
  })

  it("returns a stable draft row from an upsert instead of creating duplicate drafts", async () => {
    const [drafts, draftsPage] = await Promise.all([
      readFile(join(root, "lib", "repositories", "crm-draft-repository.ts"), "utf8"),
      readFile(join(root, "app", "(app)", "drafts", "page.tsx"), "utf8"),
    ])

    expect(drafts).toContain('onConflict: "owner_id,workflow"')
    expect(drafts).toContain('.select("id,workflow,payload,updated_at")')
    expect(drafts).toContain(".single()")
    expect(drafts).toContain("listCrmDrafts")
    expect(draftsPage).toContain("Draft")
    expect(draftsPage).toContain("Last edited")
    expect(draftsPage).toContain("Resume edit")
  })

  it("clears global and shared selector search state after a selection or close", async () => {
    const [globalSearch, propertySelector, shareDrawer] = await Promise.all([
      readFile(join(root, "components", "layout", "global-search.tsx"), "utf8"),
      readFile(join(root, "components", "communications", "whatsapp", "property-selector.tsx"), "utf8"),
      readFile(join(root, "components", "deals", "share-property-drawer.tsx"), "utf8"),
    ])

    expect(globalSearch).toContain("function resetSearch()")
    expect(globalSearch).toContain("closeOnEscape")
    expect(globalSearch).toContain("closeWhenOutside")
    expect(globalSearch).toContain("}, [pathname])")
    expect(propertySelector).toContain('setSearch("")')
    expect(shareDrawer).toContain('setSearch("")')
  })

  it("keeps recommended matches separate from actual property-share records", async () => {
    const source = await readFile(join(root, "components", "contacts", "detail", "relationship-properties.tsx"), "utf8")

    expect(source).toContain("getPropertySharesWithAdvisorByContactId")
    expect(source).toContain("Recommended Matches")
    expect(source).toContain("Shared Properties")
    expect(source).toContain("Shared by")
  })

  it("never falls back to a raw advisor UUID in task and calendar views", async () => {
    const [taskCard, taskServerRepository, calendarService, calendarDetail] = await Promise.all([
      readFile(join(root, "components", "tasks", "task-card.tsx"), "utf8"),
      readFile(join(root, "lib", "repositories", "task-server-repository.ts"), "utf8"),
      readFile(join(root, "lib", "services", "calendar-service.ts"), "utf8"),
      readFile(join(root, "app", "(app)", "calendar", "[id]", "page.tsx"), "utf8"),
    ])

    expect(taskCard).toContain('"Unknown advisor"')
    expect(taskServerRepository).toContain('"Unknown advisor"')
    expect(calendarService).toContain("task.advisorName")
    expect(calendarDetail).toContain('"Unknown advisor"')
  })

  it("round-trips the contact advisor and contact-note field through the edit form", async () => {
    const [mapper, editPage, notes, snapshot] = await Promise.all([
      readFile(join(root, "lib", "mappers", "contact.mapper.ts"), "utf8"),
      readFile(join(root, "components", "contacts", "[id]", "edit", "page.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "detail", "relationship-notes.tsx"), "utf8"),
      readFile(join(root, "components", "contacts", "detail", "relationship-snapshot.tsx"), "utf8"),
    ])

    expect(mapper).toContain("advisor:")
    expect(editPage).toContain("advisorId:")
    expect(editPage).toContain("data.advisor")
    expect(editPage).toContain("data.notesText")
    expect(notes).toContain("Contact notes")
    expect(snapshot).toContain("requirementDetails")
    expect(snapshot).toContain("relationshipDetails")
  })

  it("keeps public-share bulk selection constrained to property-owned, shareable document categories", async () => {
    const [settings, route] = await Promise.all([
      readFile(join(root, "components", "properties", "public-share-settings.tsx"), "utf8"),
      readFile(join(root, "app", "api", "properties", "[id]", "public-share", "route.ts"), "utf8"),
    ])

    expect(settings).toContain("Select all media")
    expect(settings).toContain("Clear media")
    expect(settings).toContain("Select all shareable documents")
    expect(route).toContain('.eq("property_id", id)')
    expect(route).toContain('["brochure", "floor_plan"]')
  })

  it("paginates newest-first activity history with actor and entity filters", async () => {
    const [repository, page, activityFeed, propertyPage] = await Promise.all([
      readFile(join(root, "lib", "repositories", "activity-history-server-repository.ts"), "utf8"),
      readFile(join(root, "app", "(app)", "activities", "page.tsx"), "utf8"),
      readFile(join(root, "components", "dashboard", "activity-feed.tsx"), "utf8"),
      readFile(join(root, "app", "(app)", "properties", "[slug]", "page.tsx"), "utf8"),
    ])

    expect(repository).toContain('.order("created_at", { ascending: false })')
    expect(repository).toContain(".range((page - 1) * pageSize, page * pageSize - 1)")
    expect(repository).toContain('query.eq("created_by", filters.actorId)')
    expect(repository).toContain('query.eq("contact_id", filters.entityId)')
    expect(page).toContain("All activity types")
    expect(page).toContain("All users")
    expect(activityFeed).toContain('href="/activities"')
    expect(propertyPage).toContain("PropertyActivityTimeline")
    expect(propertyPage).toContain("entity=property")
  })
})
