import { supabase } from "@/lib/supabase/client"



export type PropertyShareStatus =
  | "shared"
  | "viewed"
  | "interested"
  | "site_visit"
  | "rejected"



export interface PropertyShare {

  id: string

  dealId: string

  contactId: string

  propertyId: string

  status: PropertyShareStatus

  buyerFeedback?: string

  notes?: string

  sharedAt: string

  createdAt: string

}





function mapPropertyShareRow(
  row: any
): PropertyShare {

  return {

    id:
      row.id,


    dealId:
      row.deal_id,


    contactId:
      row.contact_id,


    propertyId:
      row.property_id,


    status:
      row.status,


    buyerFeedback:
      row.buyer_feedback ?? undefined,


    notes:
      row.notes ?? undefined,


    sharedAt:
      row.shared_at,


    createdAt:
      row.created_at,

  }

}





export async function createPropertyShare(
  data: {
    dealId: string
    contactId: string
    propertyId: string
    notes?: string
  }
): Promise<PropertyShare> {


  const {
    data: row,
    error,
  } =
    await supabase
      .from("property_shares")
      .insert({

        deal_id:
          data.dealId,


        contact_id:
          data.contactId,


        property_id:
          data.propertyId,


        notes:
          data.notes ?? null,

      })
      .select()
      .single()



  if(error){

    throw error

  }



  return mapPropertyShareRow(row)

}





export async function getPropertySharesByDealId(
  dealId: string
): Promise<PropertyShare[]> {


  const {
    data,
    error,
  } =
    await supabase
      .from("property_shares")
      .select("*")
      .eq(
        "deal_id",
        dealId
      )
      .order(
        "created_at",
        {
          ascending:false,
        }
      )



  if(error){

    throw error

  }



  return (
    data ?? []
  ).map(
    mapPropertyShareRow
  )

}





export async function updatePropertyShareStatus(
  id:string,
  status:PropertyShareStatus,
  buyerFeedback?:string
): Promise<PropertyShare>{


  const {
    data,
    error,
  } =
    await supabase
      .from("property_shares")
      .update({

        status,

        buyer_feedback:
          buyerFeedback ?? null,

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



  return mapPropertyShareRow(data)

}