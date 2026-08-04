import {
  supabase,
} from "@/lib/supabase/client"



export async function getHousingLeads(){


  const {
    data,
    error,
  } =
  await supabase
    .from("deals")
    .select(`
      id,
      name,
      stage,
      property_id,
      housing_lead_id,

      contact:contacts(
  id,
  first_name,
  last_name,
  phone,
  email,
  housing_lead_id,
  lead_source,
  locations,
  property_type,
  budget_min,
  budget_max
)

    `)
    .not(
      "housing_lead_id",
      "is",
      null
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



  const propertyIds =
    (data ?? [])
      .map(
        deal =>
          deal.property_id
      )
      .filter(Boolean)



  const {
    data: properties,
  } =
  propertyIds.length

    ? await supabase
        .from("properties")
        .select(
          "id,name,slug"
        )
        .in(
          "id",
          propertyIds
        )

    : {
        data:[]
      }





  return (
    data ?? []
  )
  .map(
    deal => ({

      id:
        deal.id,


      contact:
  Array.isArray(deal.contact)
    ? deal.contact
    : deal.contact
      ? [deal.contact]
      : [],


      property:
        properties?.find(
          property =>
            property.id === deal.property_id
        )
        ??
        null,


      housingLeadId:
        deal.housing_lead_id,


      name:
        deal.name,


      stage:
        deal.stage,


    })
  )

}