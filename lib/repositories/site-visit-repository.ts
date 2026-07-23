import {
  supabase,
} from "@/lib/supabase/client"



export type SiteVisitStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rescheduled"



export interface SiteVisit {

  id:string

  dealId:string

  contactId:string

  propertyId:string

  scheduledDate:string

  scheduledTime:string

  status:SiteVisitStatus

  notes?:string

  buyerFeedback?:string

  advisorId?:string

  createdAt:string

  updatedAt:string

}





function mapSiteVisitRow(
  row:any
):SiteVisit {


  return {

    id:
      row.id,


    dealId:
      row.deal_id,


    contactId:
      row.contact_id,


    propertyId:
      row.property_id,


    scheduledDate:
      row.scheduled_date,


    scheduledTime:
      row.scheduled_time,


    status:
      row.status,


    notes:
      row.notes ?? undefined,


    buyerFeedback:
      row.buyer_feedback ?? undefined,


    advisorId:
      row.advisor_id ?? undefined,


    createdAt:
      row.created_at,


    updatedAt:
      row.updated_at,

  }

}





export async function createSiteVisit(
  data:{
    dealId:string
    contactId:string
    propertyId:string
    scheduledDate:string
    scheduledTime:string
    notes?:string
    advisorId?:string
  }
):Promise<SiteVisit>{


  const {
    data:row,
    error,
  } =
    await supabase
      .from("site_visits")
      .insert({

        deal_id:
          data.dealId,


        contact_id:
          data.contactId,


        property_id:
          data.propertyId,


        scheduled_date:
          data.scheduledDate,


        scheduled_time:
          data.scheduledTime,


        notes:
          data.notes ?? null,


        advisor_id:
          data.advisorId ?? null,

      })
      .select()
      .single()



  if(error){

    throw error

  }



  return mapSiteVisitRow(row)

}





export async function getSiteVisitsByDealId(
  dealId:string
):Promise<SiteVisit[]> {


  const {
    data,
    error,
  } =
    await supabase
      .from("site_visits")
      .select("*")
      .eq(
        "deal_id",
        dealId
      )
      .order(
        "scheduled_date",
        {
          ascending:true,
        }
      )



  if(error){

    throw error

  }



  return (
    data ?? []
  ).map(
    mapSiteVisitRow
  )

}





export async function updateSiteVisitStatus(
  id:string,
  status:SiteVisitStatus,
  buyerFeedback?:string
):Promise<SiteVisit>{


  const {
    data,
    error,
  } =
    await supabase
      .from("site_visits")
      .update({

        status,


        buyer_feedback:
          buyerFeedback ?? null,


        updated_at:
          new Date().toISOString(),

      })
      .eq(
        "id",
        id
      )
      .select()
      .single()



  if(error){

    throw error

  }



  return mapSiteVisitRow(data)

}