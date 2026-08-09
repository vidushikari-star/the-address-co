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
  contactId:string,
  {
    useLinkedPropertyData = false,
  }:{
    useLinkedPropertyData?:boolean
  } = {}
):Promise<ContactSummary>{


  const propertyResult =
    useLinkedPropertyData
      ? await supabase
          .from("property_contacts")
          .select("property_id")
          .eq(
            "contact_id",
            contactId
          )
      : await supabase
          .from("property_contacts")
          .select("property_id")
          .eq(
            "contact_id",
            contactId
          )
          .eq(
            "relationship_type",
            "owner"
          )



  const propertyIds = [
    ...new Set(
      (propertyResult.data ?? [])
        .map(
          property =>
            property.property_id
        )
    ),
  ]



  const [
    dealsResult,
    commissionResult,
    activityResult,
  ] =
  await Promise.all([



    useLinkedPropertyData
      ? propertyIds.length > 0
        ? supabase
            .from("deals")
            .select("id,stage")
            .in(
              "property_id",
              propertyIds
            )
        : Promise.resolve({ data: [] })
      : supabase
          .from("deals")
          .select("id,stage")
          .eq(
            "contact_id",
            contactId
          ),



    useLinkedPropertyData
      ? propertyIds.length > 0
        ? supabase
            .from("commissions")
            .select("amount")
            .in(
              "property_id",
              propertyIds
            )
        : Promise.resolve({ data: [] })
      : supabase
          .from("commissions")
          .select("amount")
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
