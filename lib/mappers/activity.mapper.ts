import type { Activity } from "@/types/activity"


export function mapActivityRow(
  row: any
): Activity {

  return {

    id:
      row.id,

    type:
      row.type,

    title:
      row.title ?? "",


    description:
      row.description ?? undefined,


    body:
      row.body ?? undefined,


    date:
      row.activity_date ??
      row.created_at,


    createdAt:
      new Date(
        row.created_at ??
        row.activity_date
      ),


    createdBy:
      row.created_by ?? undefined,


    userId:
      row.user_id ?? undefined,


    contactId:
      row.contact_id ?? undefined,


    propertyId:
      row.property_id ?? undefined,


    dealId:
      row.deal_id ?? undefined,

  }
}