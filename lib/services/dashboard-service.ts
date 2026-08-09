import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"

import { getDeals } from "@/lib/repositories/deal-repository"

import { getProperties } from "@/lib/repositories/property-repository"

import { createServerSupabaseClient } from "@/lib/supabase/server"

import { supabase } from "@/lib/supabase/client"

import {
  calculateDealHealth,
} from "@/lib/services/deal-health-service"

import {
  formatCurrency,
} from "@/lib/utils/format-currency"

import {
  getLeadPriority,
} from "@/lib/utils/lead-score"

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



const activeSaleProperties =
  properties.filter(
    property =>
      property.transactionType === "Sale"
      &&
      [
        "available",
        "viewed",
        "shortlisted",
        "offer",
      ].includes(
        property.status
      )
  )



const portfolioValue =
  activeSaleProperties.reduce(
    (sum, property) =>
      sum +
      (
        property.price.asking ?? 0
      ),
    0
  )





  return {

    contactsCount:
  contacts.length,


activeContactsCount:
  contacts.filter(
    contact =>
      ![
        "lost",
        "inactive",
      ].includes(
        contact.stage
      )
  ).length,

    openDealsCount:
      openDeals.length,

    propertiesCount:
  activeSaleProperties.length,

    portfolioValue,

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


      case "contact_created":
      case "lead_stage_changed":

        type = "client"

        break



      case "property_shared":
      case "property_viewed":
      case "site_visit":

        type = "property"

        break



      case "deal_closed":
      case "commission":
      case "commission_received":

        type = "commission"

        break



      default:

        type = "document"

    }



    return {

      id:
        activity.id,


      time:

        new Date(
          activity.created_at
        ).toLocaleTimeString(
          "en-IN",
          {
            hour:"2-digit",
            minute:"2-digit",
          }
        ),


      title:
        activity.title,


      description:
        activity.description
        ??
        activity.body
        ??
        "",


      type,


      contactId:
        activity.contact_id,


      dealId:
        activity.deal_id,


      propertyId:
        activity.property_id,


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
      .limit(10)



  if(error){

    throw error

  }



  const now =
    new Date()



  return (

    data ?? []

  )

  .sort(
    (a,b)=>{

      const aDate =
        a.due_date
          ? new Date(
              a.due_date
            ).getTime()
          : Infinity


      const bDate =
        b.due_date
          ? new Date(
              b.due_date
            ).getTime()
          : Infinity


      return aDate - bDate

    }
  )

  .slice(
    0,
    5
  )

  .map(

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

        id:
          task.id,


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
          task.description
          ??
          task.assigned_to
          ??
          "",



        type,



        contactId:
          task.contact_id,



        dealId:
          task.deal_id,


        propertyId:
          task.property_id,


        isOverdue:
          task.due_date
            ? new Date(
                task.due_date
              ) < now
            : false,


      }


    }

  )


}









export async function getHotLeads(){

  const contacts =
    await ContactsRepository.getAll()



  const hotLeads =
    contacts
      .filter(
        contact =>
          getLeadPriority(contact).priority === "hot"
      )
      .sort(
  (a,b) => {

    const aFollowUp =
      a.nextFollowUpAt
        ? new Date(
            a.nextFollowUpAt
          ).getTime()
        : Infinity


    const bFollowUp =
      b.nextFollowUpAt
        ? new Date(
            b.nextFollowUpAt
          ).getTime()
        : Infinity


    return aFollowUp - bFollowUp

  }
)
      .slice(
        0,
        5
      )





  return hotLeads.map(
    contact => ({

      id:
        contact.id,


      name:
        contact.name,


      budget:
        formatCurrency(
          contact.budgetMax ??
          contact.budgetMin ??
          0
        ),


      location:
        contact.locations?.join(", ")
        ??
        "-",


      intent:
        contact.intent,


      propertyType:
        contact.propertyType,


      timeline:
        contact.timeline,

    })
  )

}









export async function getNewLeads(){

  const contacts =
    await ContactsRepository.getAll()



  return (

    contacts

      .filter(
        contact =>
          contact.stage === "new"
          ||
          contact.stage === "contacted"
      )

      .sort(
        (a,b) =>
          new Date(
            b.createdAt ?? 0
          ).getTime()
          -
          new Date(
            a.createdAt ?? 0
          ).getTime()
      )

      .slice(
        0,
        5
      )

      .map(
        contact => ({

          id:
            contact.id,


          name:
            contact.name,


          property:
            contact.propertyType
            ??
            "-",


          description:
            contact.intent
              ? `${contact.intent} enquiry`
              : "New relationship created",



          createdAt:
            contact.createdAt
            ??
            new Date().toISOString(),



          contactId:
            contact.id,


          phone:
            contact.whatsapp
            ??
            contact.phone
            ??
            "",



          intent:
            contact.intent,

        })

      )

  )

}

export async function getMyWork(
  userId?: string
){

const [
activeDealsResult,
upcomingVisitsResult,
tasksResult,
] =
await Promise.all([


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




  supabase
    .from("site_visits")
    .select(
      "id",
      {
        count:"exact",
        head:true,
      }
    )
    .gte(
      "scheduled_date",
      new Date()
        .toISOString()
        .split("T")[0]
    )
    .neq(
      "status",
      "cancelled"
    )
    .eq(
      "advisor_id",
      userId ?? ""
    ),

    supabase
  .from("tasks")
  .select(
    "id",
    {
      count:"exact",
      head:true,
    }
  )
  .eq(
    "status",
    "pending"
  )
  .eq(
    "assigned_to",
    userId ?? ""
  ),


])



return {

  newLeads:
    0,

  followUps:
    0,

  myTasks:
    tasksResult.count ?? 0,

  activeDeals:
    activeDealsResult.count ?? 0,

  upcomingVisits:
    upcomingVisitsResult.count ?? 0,

}

}



export async function getDealHealthSummary(){


  const deals =
    await getDeals()



  const activeDeals =
  deals.filter(
    deal =>
      deal.stage !== "closed_won"
      &&
      deal.stage !== "closed_lost"
  )


const summary = {

  healthy: 0,

  attention: 0,

  risk: 0,

  total: activeDeals.length,

}




  const concerns: {
  id: string
  name: string
  score: number
  status: string
  reasons: string[]
}[] = []



  activeDeals.forEach(
  deal => {


      




      const health =
        calculateDealHealth(
          deal
        )



      summary[
        health.status
      ]++




      if(
        health.status !== "healthy"
      ){

        concerns.push({

          id:
            deal.id,

          name:
            deal.name,

          score:
            health.score,

          status:
            health.status,

          reasons:
            health.reasons,

        })

      }


    }
  )





  return {

    ...summary,

    concerns:
      concerns
        .sort(
          (a,b)=>
            a.score - b.score
        )
        .slice(
          0,
          5
        ),

  }


}

export async function getFollowUpContacts(){

  const contacts =
    await ContactsRepository.getAll()



  const now =
    new Date()



  const startOfToday =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )



  const sevenDaysAgo =
    new Date(
      now.getTime()
      -
      7 *
      24 *
      60 *
      60 *
      1000
    )



  const overdue =
    contacts
      .filter(
        contact => {


          if(
            contact.nextFollowUpAt
          ){

            return (
              new Date(
                contact.nextFollowUpAt
              )
              <
              now
            )

          }



          if(
            !contact.lastActivityAt
          ){

            return true

          }



          return (
            new Date(
              contact.lastActivityAt
            )
            <
            sevenDaysAgo
          )


        }
      )
      .slice(
        0,
        10
      )





  const today =
    contacts
      .filter(
        contact => {


          if(
            !contact.nextFollowUpAt
          ){

            return false

          }



          const followUp =
            new Date(
              contact.nextFollowUpAt
            )



          return (
            followUp >= startOfToday
            &&
            followUp < new Date(
              startOfToday.getTime()
              +
              24 *
              60 *
              60 *
              1000
            )
          )


        }
      )
      .slice(
        0,
        10
      )






  const upcoming =
    contacts
      .filter(
        contact => {


          if(
            !contact.nextFollowUpAt
          ){

            return false

          }



          return (
            new Date(
              contact.nextFollowUpAt
            )
            >
            now
          )


        }
      )
      .slice(
        0,
        10
      )





  return {

    overdue,

    today,

    upcoming,

  }


}

