import type { Deal } from "@/types/deal"



export function mapDealRow(
  row: any
): Deal {

  return {

    id:
      row.id,


    name:
      row.name ??
      "Untitled Deal",



    stage:
      row.stage ??
      "lead",



    contactId:
      row.contact_id ??
      "",



    propertyId:
      row.property_id ??
      "",



    advisor:
  row.advisor?.name ??
  "",



    advisorId:
      row.advisor_id ??
      undefined,



    value: {

      propertyPrice:
        Number(
          row.property_price ?? 0
        ),



      commissionPercentage:
        Number(
          row.commission_percentage ?? 0
        ),



      commissionAmount:
        Number(
          row.commission_amount ?? 0
        ),

    },



    expectedCloseDate:
      row.expected_close_date ??
      undefined,



    probability:
      Number(
        row.probability ?? 0
      ),



    notes:
      row.notes
        ? [row.notes]
        : [],



    createdAt:
      row.created_at ??
      new Date().toISOString(),



    updatedAt:
      row.updated_at ??
      new Date().toISOString(),



    priority:
      row.priority ??
      "medium",



    tasks:
      row.tasks ??
      [],



    lastActivity:
      row.last_activity ??
      row.updated_at ??
      new Date().toISOString(),

  }

}