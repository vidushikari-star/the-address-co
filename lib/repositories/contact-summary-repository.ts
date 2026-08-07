import {
  supabase,
} from "@/lib/supabase/client"



export type ContactSummary = {

  propertiesOwned:number

  dealsCount:number

  closedDeals:number

  commissionGenerated:number

  lastActivityAt?:string

}





export async function getContactSummary(
  contactId:string
):Promise<ContactSummary>{


  const [
    propertyResult,
    dealsResult,
    commissionResult,
    activityResult,
  ] =
  await Promise.all([



    supabase
      .from("property_contacts")
      .select(
        "id"
      )
      .eq(
        "contact_id",
        contactId
      )
      .eq(
        "relationship_type",
        "owner"
      ),




    supabase
      .from("deals")
      .select(
        "id,stage"
      )
      .eq(
        "contact_id",
        contactId
      ),




    supabase
      .from("commissions")
      .select(
        "amount"
      )
      .eq(
        "contact_id",
        contactId
      ),




    supabase
      .from("activities")
      .select(
        "date,created_at"
      )
      .eq(
        "contact_id",
        contactId
      )
      .order(
        "created_at",
        {
          ascending:false
        }
      )
      .limit(1)

  ])




  const deals =
    dealsResult.data ?? []



  const commissions =
    commissionResult.data ?? []



  return {


    propertiesOwned:
      propertyResult.data?.length
      ??
      0,



    dealsCount:
      deals.length,



    closedDeals:
      deals.filter(
        deal =>
          deal.stage === "closed_won"
      )
      .length,



    commissionGenerated:
      commissions.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.amount ?? 0
          ),
        0
      ),



    lastActivityAt:
      activityResult.data?.[0]?.date
      ??
      activityResult.data?.[0]?.created_at

  }


}