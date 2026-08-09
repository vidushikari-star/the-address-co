import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getHousingLeads(){

  const supabase =
    await createServerSupabaseClient()


  const {
    data: contacts,
    error,
  } =
  await supabase
    .from("contacts")
    .select(`
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
    `)
    .eq(
      "lead_source",
      "housing"
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





  const contactIds =
    (contacts ?? [])
      .map(
        contact =>
          contact.id
      )





  const {
    data: deals,
  } =
  contactIds.length

    ? await supabase
        .from("deals")
        .select(`
          id,
          contact_id,
          name,
          stage,
          property_id
        `)
        .in(
          "contact_id",
          contactIds
        )

    : {
        data:[]
      }





  const propertyIds =
    (deals ?? [])
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





  const dealIds =
    (deals ?? [])
      .map(
        deal =>
          deal.id
      )





  const {
    data: commissions,
  } =
  dealIds.length

    ? await supabase
        .from("commissions")
        .select(`
          id,
          deal_id,
          amount,
          status
        `)
        .in(
          "deal_id",
          dealIds
        )

    : {
        data:[]
      }






  const {
    data: activities,
  } =
  contactIds.length

    ? await supabase
        .from("activities")
        .select(`
          id,
          contact_id,
          title,
          type,
          created_at
        `)
        .in(
          "contact_id",
          contactIds
        )
        .order(
          "created_at",
          {
            ascending:false,
          }
        )

    : {
        data:[]
      }







  return (

    contacts ?? []

  )
  .map(

    contact => {


      const deal =
        deals?.find(
          item =>
            item.contact_id === contact.id
        )



      const property =
        properties?.find(
          item =>
            item.id === deal?.property_id
        )
        ??
        null





      const commission =
        commissions?.find(
          item =>
            item.deal_id === deal?.id
        )





      const lastActivity =
        activities?.find(
          item =>
            item.contact_id === contact.id
        )





      return {

        id:
          contact.id,



        contact:[
          contact,
        ],



        housingLeadId:
          contact.housing_lead_id,



        name:
          `${contact.first_name ?? ""} ${
            contact.last_name ?? ""
          }`,



        stage:
          deal?.stage
          ??
          "new",



        dealId:
          deal?.id
          ??
          null,



        property,



        converted:
          Boolean(
            deal?.property_id
          ),




        lastActivity:
          lastActivity
            ? {

                id:
                  lastActivity.id,


                title:
                  lastActivity.title,


                type:
                  lastActivity.type,


                createdAt:
                  lastActivity.created_at,

              }

            : null,





        commission:
          commission
            ? {

                id:
                  commission.id,


                amount:
                  commission.amount,


                status:
                  commission.status,

              }

            : null,


      }

    }

  )

}
