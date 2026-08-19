import { readFile } from "node:fs/promises"
import { join } from "node:path"

import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

const siteVisitRepository = vi.hoisted(() => ({
  createSiteVisit: vi.fn(),
  deleteSiteVisit: vi.fn(),
  updateSiteVisit: vi.fn(),
}))

const activityRepository = vi.hoisted(() => ({
  createActivity: vi.fn(),
}))

vi.mock("@/lib/repositories/site-visit-repository", () => siteVisitRepository)
vi.mock("@/lib/repositories/activity-repository", () => activityRepository)

import {
  createSiteVisitWithActivity,
  updateSiteVisitWithActivity,
} from "@/lib/services/site-visit-workflow"

import type { SiteVisit } from "@/types/site-visit"

const root = process.cwd()

const scheduledVisit: SiteVisit = {
  id: "visit-1",
  dealId: "deal-1",
  contactId: "contact-1",
  propertyId: "property-1",
  advisorId: "advisor-1",
  scheduledDate: "2026-08-20",
  scheduledTime: "10:30",
  status: "scheduled",
  notes: "Bring floor plans",
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
}

describe("Calendar Site Visit workflow", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    siteVisitRepository.createSiteVisit.mockResolvedValue(scheduledVisit)
    siteVisitRepository.updateSiteVisit.mockResolvedValue(scheduledVisit)
    siteVisitRepository.deleteSiteVisit.mockResolvedValue(undefined)
    activityRepository.createActivity.mockResolvedValue({ id: "activity-1" })
  })

  it("keeps a Calendar meeting on calendar_events while routing a Site Visit to the canonical workflow", async () => {
    const source = await readFile(
      join(root, "components", "calendar", "calendar-event-form.tsx"),
      "utf8"
    )

    expect(source).toContain('form.eventType === "site_visit"')
    expect(source).toContain("createSiteVisitWithActivity")
    expect(source).toContain("else if(")
    expect(source).toContain("await createCalendarEvent")
  })

  it("creates exactly one canonical Site Visit and one linked Activity", async () => {
    await createSiteVisitWithActivity({
      dealId: "deal-1",
      contactId: "contact-1",
      propertyId: "property-1",
      scheduledDate: "2026-08-20",
      scheduledTime: "10:30",
      notes: "Bring floor plans",
      advisorId: "advisor-1",
      activityDescription: "Property walk-through",
    })

    expect(siteVisitRepository.createSiteVisit).toHaveBeenCalledTimes(1)
    expect(siteVisitRepository.createSiteVisit).toHaveBeenCalledWith(expect.objectContaining({
      dealId: "deal-1",
      contactId: "contact-1",
      propertyId: "property-1",
      advisorId: "advisor-1",
    }))
    expect(activityRepository.createActivity).toHaveBeenCalledWith(expect.objectContaining({
      type: "site_visit",
      contactId: "contact-1",
      propertyId: "property-1",
      dealId: "deal-1",
      description: "Property walk-through",
    }))
  })

  it("updates the existing canonical visit for reschedules and cancellation without creating another visit", async () => {
    const cancelled = {
      ...scheduledVisit,
      scheduledDate: "2026-08-22",
      status: "cancelled" as const,
    }
    siteVisitRepository.updateSiteVisit.mockResolvedValue(cancelled)

    await updateSiteVisitWithActivity(scheduledVisit, {
      scheduledDate: "2026-08-22",
      status: "cancelled",
      activityDescription: "Property walk-through",
    })

    expect(siteVisitRepository.createSiteVisit).not.toHaveBeenCalled()
    expect(siteVisitRepository.updateSiteVisit).toHaveBeenCalledTimes(1)
    expect(siteVisitRepository.updateSiteVisit).toHaveBeenCalledWith(
      "visit-1",
      expect.objectContaining({
        scheduledDate: "2026-08-22",
        status: "cancelled",
      })
    )
    expect(activityRepository.createActivity).toHaveBeenCalledWith(expect.objectContaining({
      title: "Site visit cancelled",
      contactId: "contact-1",
      propertyId: "property-1",
    }))
  })

  it("rolls back a newly-created Site Visit if its linked Activity cannot be persisted", async () => {
    activityRepository.createActivity.mockRejectedValue(new Error("activity failed"))

    await expect(createSiteVisitWithActivity({
      contactId: "contact-1",
      propertyId: "property-1",
      scheduledDate: "2026-08-20",
      scheduledTime: "10:30",
      advisorId: "advisor-1",
    })).rejects.toThrow("activity failed")

    expect(siteVisitRepository.deleteSiteVisit).toHaveBeenCalledWith("visit-1")
  })

  it("keeps the downstream readers on site_visits and adds the missing Activity property relationship without RLS changes", async () => {
    const [calendarService, dashboardService, contactPage, propertyPage, migration] = await Promise.all([
      readFile(join(root, "lib", "services", "calendar-service.ts"), "utf8"),
      readFile(join(root, "lib", "services", "dashboard-service.ts"), "utf8"),
      readFile(join(root, "app", "(app)", "contacts", "[id]", "page.tsx"), "utf8"),
      readFile(join(root, "app", "(app)", "properties", "[slug]", "page.tsx"), "utf8"),
      readFile(join(root, "supabase", "migrations", "20260819100000_reconcile_calendar_site_visits_and_activity_property_links.sql"), "utf8"),
    ])

    expect(calendarService).toContain("crm.getAllSiteVisits()")
    expect(dashboardService).toContain('.from("site_visits")')
    expect(contactPage).toContain("crm.getSiteVisitsByContactId")
    expect(propertyPage).toContain('entity: "property"')
    expect(migration).toContain("add column if not exists property_id")
    expect(migration).toContain("delete from public.calendar_events")
    expect(migration).not.toMatch(/row level security|create policy|grant |revoke /i)
  })
})
