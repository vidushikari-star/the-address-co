import { createServerSupabaseClient } from "@/lib/supabase/server"

import type { CalendarEvent } from "@/types/calendar-event"
import type { UserProfile } from "@/types/user"

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

function mapEvent(row: CalendarEventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    eventType: row.event_type,
    startTime: row.start_time,
    endTime: row.end_time ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    createdBy: row.created_by,
    contactId: row.contact_id ?? undefined,
    propertyId: row.property_id ?? undefined,
    dealId: row.deal_id ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getServerCalendarEvent(
  id: string
): Promise<CalendarEvent | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return mapEvent(data as CalendarEventRow)
}

export async function getServerCalendarUsers(): Promise<UserProfile[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("user_profiles")
    .select("id,name,email,role,created_at,updated_at")
    .order("name")

  if (error) {
    throw error
  }

  return (data ?? []).map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email ?? undefined,
    role: user.role,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  }))
}
