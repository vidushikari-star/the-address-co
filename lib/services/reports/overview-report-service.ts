import { createServerSupabaseClient } from "@/lib/supabase/server"


export async function getOverviewReport(){

  const supabase =
  await createServerSupabaseClient()
  
    const [
    contactsResult,
    propertiesResult,
    dealsResult,
  ] = await Promise.all([


    supabase
      .from("contacts")
      .select(
        `
        id,
        lead_temperature,
        next_follow_up_at,
        relationship_types
        `,
        {
          count:"exact",
        }
      ),



    supabase
      .from("properties")
      .select(
        `
        id,
        status
        `,
        {
          count:"exact",
        }
      ),



    supabase
      .from("deals")
      .select(
        `
        id,
        stage,
        property_price,
        probability
        `,
        {
          count:"exact",
        }
      ),


  ])


  if(contactsResult.error){
    throw contactsResult.error
  }


  if(propertiesResult.error){
    throw propertiesResult.error
  }


  if(dealsResult.error){
    throw dealsResult.error
  }



  const contacts =
    contactsResult.data ?? []


  const properties =
    propertiesResult.data ?? []


  const deals =
    dealsResult.data ?? []



  const hotLeads =
    contacts.filter(
      contact =>
        contact.lead_temperature === "hot" &&
        contact.relationship_types?.includes("buyer")
    ).length



  const pendingFollowUps =
    contacts.filter(
      contact => {

        if(!contact.next_follow_up_at){
          return false
        }


        return (
          new Date(
            contact.next_follow_up_at
          ) <= new Date()
        )

      }
    ).length



  const activeProperties =
    properties.filter(
      property =>
        property.status === "available"
    ).length



  const activeDeals =
    deals.filter(
      deal =>
        ![
          "closed_won",
          "closed_lost",
        ].includes(
          deal.stage
        )
    ).length



  const pipelineValue =
    deals.reduce(
      (
        total,
        deal
      ) => {

        if(
          [
            "closed_won",
            "closed_lost",
          ].includes(
            deal.stage
          )
        ){
          return total
        }


        return (
          total
          +
          (
            Number(
              deal.property_price
              ??
              0
            )
            *
            (
              Number(
                deal.probability
                ??
                0
              )
              /
              100
            )
          )
        )

      },
      0
    )



  return {

    totalContacts:
      contacts.length,


    hotLeads,


    activeProperties,


    activeDeals,


    pipelineValue,


    pendingFollowUps,

  }

}
