import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  createSiteVisit,
  deleteSiteVisit,
  updateSiteVisit,
} from "@/lib/repositories/site-visit-repository"

import type {
  SiteVisit,
  SiteVisitStatus,
} from "@/types/site-visit"

export type CreateSiteVisitWorkflowInput = {
  dealId?: string
  contactId: string
  propertyId: string
  scheduledDate: string
  scheduledTime: string
  notes?: string
  advisorId?: string
  activityDescription?: string
}

export type UpdateSiteVisitWorkflowInput = {
  scheduledDate?: string
  scheduledTime?: string
  advisorId?: string
  contactId?: string
  propertyId?: string
  status?: SiteVisitStatus
  notes?: string
  buyerFeedback?: string
  activityDescription?: string
}

function visitSchedule(date: string, time: string) {
  return `${date} at ${time || "00:00"}`
}

function activityTitle(status: SiteVisitStatus) {
  if (status === "completed") return "Site visit completed"
  if (status === "cancelled") return "Site visit cancelled"
  if (status === "rescheduled") return "Site visit rescheduled"
  return "Site visit updated"
}

function hasLifecycleChange(
  visit: SiteVisit,
  updates: UpdateSiteVisitWorkflowInput
) {
  return (
    updates.scheduledDate !== undefined && updates.scheduledDate !== visit.scheduledDate
    || updates.scheduledTime !== undefined && updates.scheduledTime !== visit.scheduledTime
    || updates.advisorId !== undefined && updates.advisorId !== visit.advisorId
    || updates.contactId !== undefined && updates.contactId !== visit.contactId
    || updates.propertyId !== undefined && updates.propertyId !== visit.propertyId
    || updates.status !== undefined && updates.status !== visit.status
    || updates.notes !== undefined && updates.notes !== (visit.notes ?? "")
    || updates.buyerFeedback !== undefined && updates.buyerFeedback !== (visit.buyerFeedback ?? "")
  )
}

export async function createSiteVisitWithActivity(
  input: CreateSiteVisitWorkflowInput
): Promise<SiteVisit> {
  const visit = await createSiteVisit(input)

  try {
    await createActivity({
      type: "site_visit",
      title: "Site visit scheduled",
      description: input.activityDescription ?? "Property visit",
      body: `Scheduled for ${visitSchedule(input.scheduledDate, input.scheduledTime)}\n\n${input.notes?.trim() || "No notes added"}`,
      dealId: input.dealId,
      contactId: input.contactId,
      propertyId: input.propertyId,
      date: new Date().toISOString(),
    })
  } catch (error) {
    try {
      await deleteSiteVisit(visit.id)
    } catch (rollbackError) {
      console.error("Unable to roll back site visit after activity failure", rollbackError)
    }

    throw error
  }

  return visit
}

export async function updateSiteVisitWithActivity(
  visit: SiteVisit,
  updates: UpdateSiteVisitWorkflowInput
): Promise<SiteVisit> {
  if (!hasLifecycleChange(visit, updates)) {
    return visit
  }

  const updated = await updateSiteVisit(visit.id, updates)

  try {
    await createActivity({
      type: "site_visit",
      title: activityTitle(updated.status),
      description: updates.activityDescription ?? updated.propertyName ?? "Property visit",
      body: `Visit schedule: ${visitSchedule(updated.scheduledDate, updated.scheduledTime)}\nStatus: ${updated.status.replace(/_/g, " ")}\n\n${updated.notes?.trim() || "No notes added"}${updated.buyerFeedback?.trim() ? `\n\nBuyer feedback:\n${updated.buyerFeedback.trim()}` : ""}`,
      dealId: updated.dealId,
      contactId: updated.contactId,
      propertyId: updated.propertyId,
      date: new Date().toISOString(),
    })
  } catch (error) {
    try {
      await updateSiteVisit(visit.id, {
        scheduledDate: visit.scheduledDate,
        scheduledTime: visit.scheduledTime,
        advisorId: visit.advisorId ?? "",
        contactId: visit.contactId,
        propertyId: visit.propertyId,
        status: visit.status,
        notes: visit.notes ?? "",
        buyerFeedback: visit.buyerFeedback ?? "",
      })
    } catch (rollbackError) {
      console.error("Unable to roll back site visit after activity failure", rollbackError)
    }

    throw error
  }

  return updated
}
