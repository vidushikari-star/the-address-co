import type { Activity } from "@/types/activity"


export function mapActivityRow(
  row: Record<string, unknown>
): Activity {

  return {
  id: row.id as string,

  type: row.type as Activity["type"],

  title: (row.title as string | null) ?? "",

  description: (row.description as string | null) ?? undefined,

  body: (row.body as string | null) ?? undefined,

  date:
    ((row.activity_date as string | null) ??
      (row.created_at as string)),

  createdAt: new Date(
    ((row.created_at as string | null) ??
      (row.activity_date as string))
  ),

  createdBy:
    (row.created_by as string | null) ?? undefined,

  userId:
    (row.user_id as string | null) ?? undefined,

  actorName:
    ((row.actor as { full_name?: string | null } | null)?.full_name) ?? undefined,

  contactId:
    (row.contact_id as string | null) ?? undefined,

  propertyId:
    (row.property_id as string | null) ?? undefined,

  dealId:
    (row.deal_id as string | null) ?? undefined,
}
}
