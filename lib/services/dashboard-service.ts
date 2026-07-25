import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"

import { getDeals } from "@/lib/repositories/deal-repository"

import { getProperties } from "@/lib/repositories/property-repository"

import { createServerSupabaseClient } from "@/lib/supabase/server"

import { getPropertyMatches } from "@/lib/services/property-matching"

import { supabase } from "@/lib/supabase/client"



export async function getDashboardStats() {

  const [
    contacts,
    deals,
    properties,
  ] = await Promise.all([

    ContactsRepository.getAll(),

    getDeals(),

    getProperties(),

  ])





  const openDeals =
    deals.filter(
      (deal) =>
        ![
          "closed_won",
          "closed_lost",
        ].includes(
          deal.stage
        )
    )





  const pipelineValue =
    openDeals.reduce(
      (sum, deal) =>
        sum +
        deal.value.propertyPrice,
      0
    )





  const commissionPipeline =
    openDeals.reduce(
      (sum, deal) =>
        sum +
        deal.value.commissionAmount,
      0
    )





  return {

    contactsCount:
      contacts.length,

    openDealsCount:
      openDeals.length,

    propertiesCount:
      properties.length,

    portfolioValue:
      properties.reduce(
        (sum, property) =>
          sum +
          property.price.asking,
        0
      ),

    pipelineValue,

    commissionPipeline,

    deals,

    properties,

    contacts,

  }

}









export async function getRecentActivities() {

  const supabase =
    await createServerSupabaseClient()



  const {
    data,
    error,
  } =
    await supabase
      .from("activities")
      .select("*")
      .order(
        "created_at",
        {
          ascending:false,
        }
      )
      .limit(5)





  if(error){

    throw error

  }





  return (

    data ?? []

  ).map(

    activity => {


      let type:
        | "client"
        | "property"
        | "document"
        | "commission"





      switch(activity.type){


        case "deal_closed":

          type =
            "commission"

          break



        case "property_shared":

        case "property_viewed":

          type =
            "property"

          break



        case "contact_created":

          type =
            "client"

          break



        default:

          type =
            "document"

      }





      return {

        time:

          new Date(
            activity.created_at
          ).toLocaleTimeString(
            [],
            {
              hour:"2-digit",
              minute:"2-digit",
            }
          ),


        title:
          activity.title ?? "",


        description:
          activity.description ??
          activity.body ??
          "",


        type,

      }


    }

  )


}









export async function getUpcomingTasks(){

  const supabase =
  await createServerSupabaseClient()



  const {
    data,
    error,
  } =
    await supabase
      .from("tasks")
      .select("*")
      .eq(
        "status",
        "pending"
      )
      .order(
        "due_date",
        {
          ascending:true,
        }
      )
      .limit(5)





  if(error){

    throw error

  }





  return (

    data ?? []

  ).map(

    task => {


      const title =
        task.title ?? ""



      let type:
        | "meeting"
        | "call"
        | "visit" =
        "meeting"




      const lowerTitle =
        title.toLowerCase()





      if(
        lowerTitle.includes("call")
        ||
        lowerTitle.includes("phone")
      ){

        type =
          "call"


      }

      else if(
        lowerTitle.includes("visit")
        ||
        lowerTitle.includes("site")
      ){

        type =
          "visit"

      }





      return {

  time:

    task.due_date
      ? new Date(
          task.due_date
        ).toLocaleTimeString(
          [],
          {
            hour:"2-digit",
            minute:"2-digit",
          }
        )
      : "—",

  title,

  description:
    task.description ??
    task.assigned_to ??
    "",

  type,

  contactId:
    task.contact_id,

}

    }

  )


}









export async function getHotLeads(){


  const [
    deals,
    properties,
  ] =
  await Promise.all([

    getDeals(),

    getProperties(),

  ])





  return (

    deals

      .filter(
        deal => {


          const isActive =
            deal.stage !== "closed_won"
            &&
            deal.stage !== "closed_lost"



          const isHot =
            deal.priority === "high"
            ||
            deal.stage === "negotiation"
            ||
            deal.stage === "documentation"
            ||
            deal.stage === "site_visit"



          return (
            isActive &&
            isHot
          )


        }
      )

      .slice(
        0,
        5
      )

      .map(
        deal => {


          const property =
            properties.find(
              item =>
                item.id === deal.propertyId
            )





          return {

            id:
              deal.id,


            name:
              deal.name,


            location:
              property?.locality ??
              property?.location ??
              "-",


            stage:
              deal.stage
                .replace(
                  "_",
                  " "
                )
                .replace(
                  /\b\w/g,
                  char =>
                    char.toUpperCase()
                ),


            budget:
              `₹${(
                deal.value.propertyPrice /
                10000000
              ).toFixed(1)} Cr`,


            advisor:
              deal.advisor ?? "-",


            contactId:
              deal.contactId,


          }


        }

      )

  )


}









export async function getNewLeads(){


  const supabase =
  await createServerSupabaseClient()




  const {
    data: activities,
    error,
  } =
    await supabase
      .from("activities")
      .select(
        `
        id,
        title,
        description,
        created_at,
        contact_id,
        property_id
        `
      )
      .eq(
        "type",
        "site_visit"
      )
      .order(
        "created_at",
        {
          ascending:false,
        }
      )
      .limit(5)





  if(error){

    throw error

  }





  const contactIds =
    activities
      ?.map(
        item => item.contact_id
      )
      .filter(Boolean) ?? []





  const propertyIds =
    activities
      ?.map(
        item => item.property_id
      )
      .filter(Boolean) ?? []







  const [
    contactsResult,
    propertiesResult,
  ] =
  await Promise.all([


    supabase
      .from("contacts")
      .select(
        "id, full_name, phone, whatsapp"
      )
      .in(
        "id",
        contactIds
      ),



    supabase
      .from("properties")
      .select(
        "id, name"
      )
      .in(
        "id",
        propertyIds
      ),


  ])






  const contacts =
    contactsResult.data ?? []



  const properties =
    propertiesResult.data ?? []







  return (

    activities ?? []

  ).map(

    activity => {


      const contact =
        contacts.find(
          item =>
            item.id === activity.contact_id
        )



      const property =
        properties.find(
          item =>
            item.id === activity.property_id
        )




      return {

        id:
          activity.id,


        name:
          contact?.full_name ??
          "Unknown",


        phone:
          contact?.whatsapp ??
          contact?.phone ??
          "",


        property:
          property?.name ??
          "-",


        description:
          activity.description ??
          "",


        createdAt:
          activity.created_at,


        contactId:
          activity.contact_id,


      }


    }

  )


}
export async function getMyWork(){

  const [
    newLeadsResult,
    followUpsResult,
    activeDealsResult,
  ] =
  await Promise.all([


    supabase
      .from("contacts")
      .select(
        "id",
        {
          count:"exact",
          head:true,
        }
      )
      .eq(
        "lead_stage",
        "new"
      ),



    supabase
      .from("contacts")
      .select(
        "id",
        {
          count:"exact",
          head:true,
        }
      )
      .not(
        "next_follow_up_at",
        "is",
        null
      ),



    supabase
      .from("deals")
      .select(
        "id",
        {
          count:"exact",
          head:true,
        }
      )
      .not(
        "stage",
        "in",
        "(closed_won,closed_lost)"
      ),

  ])




  return {

    newLeads:
      newLeadsResult.count ?? 0,


    followUps:
      followUpsResult.count ?? 0,


    activeDeals:
      activeDealsResult.count ?? 0,


    upcomingVisits:
      0,

  }

}

export async function getDealsToFollowUp(){


  const [
    dealsResult,
    tasksResult,
  ] =
  await Promise.all([


    supabase
      .from("deals")
      .select("*")
      .not(
        "stage",
        "in",
        "(closed_won,closed_lost)"
      ),



    supabase
      .from("tasks")
      .select("*")
      .eq(
        "status",
        "pending"
      ),


  ])





  const deals =
    dealsResult.data ?? []



  const tasks =
    tasksResult.data ?? []





  return deals

    .filter(
      deal => {


        const relatedTask =
          tasks.some(
            task =>
              task.deal_id === deal.id
          )



        const lastActivity =
          new Date(
            deal.last_activity
          )



        const daysSinceActivity =
          Math.floor(
            (
              Date.now()
              -
              lastActivity.getTime()
            )
            /
            (
              1000 *
              60 *
              60 *
              24
            )
          )



        return (

          deal.priority === "high"

          ||

          relatedTask

          ||

          daysSinceActivity > 7

        )


      }
    )

    .slice(
      0,
      5
    )

}