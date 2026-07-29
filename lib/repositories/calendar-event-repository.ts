import {
  supabase,
} from "@/lib/supabase/client"

import type {
  UserProfile,
} from "@/types/user"

import type {
  CalendarEvent,
} from "@/types/calendar-event"

type CalendarEventRow = {
  id: string
  title: string
  description: string | null
  event_type: CalendarEvent["eventType"]
  start_time: string
  end_time: string | null
  assigned_to: string | null
  created_by: string
  contact_id: string | null
  property_id: string | null
  deal_id: string | null
  status: CalendarEvent["status"]
  created_at: string
  updated_at: string
}

function mapEvent(
  row: CalendarEventRow
): CalendarEvent {
  return {
    id: row.id,

    title: row.title,

    description:
      row.description ?? undefined,

    eventType:
      row.event_type,

    startTime:
      row.start_time,

    endTime:
      row.end_time ?? undefined,

    assignedTo:
      row.assigned_to ?? undefined,

    createdBy:
      row.created_by,

    contactId:
      row.contact_id ?? undefined,

    propertyId:
      row.property_id ?? undefined,

    dealId:
      row.deal_id ?? undefined,

    status:
      row.status,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

export async function createCalendarEvent(
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const {
    data,
    error,
  } =
    await supabase
      .from("calendar_events")
      .insert({
        title:
          event.title,

        description:
          event.description,

        event_type:
          event.eventType,

        start_time:
          event.startTime,

        end_time:
          event.endTime,

        assigned_to:
          event.assignedTo,

        created_by:
          event.createdBy,

        contact_id:
          event.contactId,

        property_id:
          event.propertyId,

        deal_id:
          event.dealId,

        status:
          "scheduled",
      })
      .select()
      .single()

  if (error) {
    throw error
  }

  return mapEvent(
    data as CalendarEventRow
  )
}

export async function getCalendarEvent(
  id: string
): Promise<CalendarEvent | null> {
  const {
    data,
    error,
  } =
    await supabase
      .from("calendar_events")
      .select("*")
      .eq(
        "id",
        id
      )
      .single()

  if (error) {
    return null
  }

  return mapEvent(
    data as CalendarEventRow
  )
}

export async function deleteCalendarEvent(
  id: string
) {
  const {
    error,
  } =
    await supabase
      .from("calendar_events")
      .delete()
      .eq(
        "id",
        id
      )

  if (error) {
    throw error
  }
}

export async function updateCalendarEvent(
  id: string,
  event: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  const {
    data,
    error,
  } =
    await supabase
      .from("calendar_events")
      .update({
        title:
          event.title,

        description:
          event.description,

        event_type:
          event.eventType,

        start_time:
          event.startTime,

        end_time:
          event.endTime,

        assigned_to:
          event.assignedTo,

        status:
          event.status,
      })
      .eq(
        "id",
        id
      )
      .select()
      .single()

  if (error) {
    throw error
  }

  return mapEvent(
    data as CalendarEventRow
  )
}

export async function getCalendarUsers(): Promise<UserProfile[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("user_profiles")
      .select("*")
      .order(
        "name"
      )

  if (error) {
    throw error
  }

  return (data ?? []).map(
    (user) => ({
      id:
        user.id,

      name:
        user.name,

      email:
        user.email ?? undefined,

      role:
        user.role,

      createdAt:
        user.created_at,

      updatedAt:
        user.updated_at,
    })
  )
}