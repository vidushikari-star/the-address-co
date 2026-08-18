import { createServerSupabaseClient } from "@/lib/supabase/server"

import { mapContactRow } from "@/lib/mappers/contact.mapper"

import { mapDealRow } from "@/lib/mappers/deal.mapper"

import { mapPropertyRow } from "@/lib/mappers/property.mapper"

import type { Contact } from "@/types/contact"

import type { ContactRow } from "@/types/contact-row"

import type { Deal } from "@/types/deal"

import type { Property } from "@/types/property"

import {
  calculateDealHealth,
} from "@/lib/services/deal-health-service"

import {
  formatCurrency,
} from "@/lib/utils/format-currency"

import {
  getLeadPriority,
} from "@/lib/utils/lead-score"

export type DashboardSupabaseClient =
  Awaited<
    ReturnType<typeof createServerSupabaseClient>
  >

async function getDashboardContacts(
  supabase: DashboardSupabaseClient
): Promise<Contact[]> {
  const {
    data,
    error,
  } = await supabase
    .from("contacts")
    .select(`
      *,
      advisor:profiles!contacts_advisor_id_fkey(
        id,
        full_name
      )
    `)
    .order(
      "created_at",
      {
        ascending: false,
      }
    )

  if (error) {
    throw error
  }

  return (data ?? []).map(
    (row) => {
      const contact = mapContactRow(
        row as ContactRow
      )

      return {
        ...contact,
        advisorId:
          row.advisor?.id ?? undefined,
        assignedAdvisor:
          row.advisor?.full_name ?? undefined,
      }
    }
  )
}

async function getDashboardDeals(
  supabase: DashboardSupabaseClient
): Promise<Deal[]> {
  const {
    data,
    error,
  } = await supabase
    .from("deals")
    .select(`
      *,
      advisor:user_profiles (
        name
      )
    `)
    .order(
      "created_at",
      {
        ascending: false,
      }
    )

  if (error) {
    throw error
  }

  return (data ?? []).map(
    mapDealRow
  )
}

async function getDashboardProperties(
  supabase: DashboardSupabaseClient
): Promise<Property[]> {
  const {
    data,
    error,
  } = await supabase
    .from("properties")
    .select("*")
    .order(
      "created_at",
      {
        ascending: false,
      }
    )

  if (error) {
    throw error
  }

  return (data ?? []).map(
    mapPropertyRow
  )
}


function getIndiaDateKey(
  date = new Date()
): string {
  const parts = new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  )
    .formatToParts(date)
    .reduce<Record<string, string>>(
      (result, part) => {
        result[part.type] = part.value
        return result
      },
      {}
    )

  return `${parts.year}-${parts.month}-${parts.day}`
}


function getTaskDueLabel(
  dueDate: string,
  today: string
): string {
  if(dueDate < today){
    return "Overdue"
  }

  if(dueDate === today){
    return "Today"
  }

  const tomorrow = new Date(
    `${today}T12:00:00+05:30`
  )

  tomorrow.setUTCDate(
    tomorrow.getUTCDate() + 1
  )

  if(
    dueDate === tomorrow
      .toISOString()
      .slice(0, 10)
  ){
    return "Tomorrow"
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    }
  ).format(
    new Date(`${dueDate}T12:00:00+05:30`)
  )
}

export async function getDashboardStats(
  supabase: DashboardSupabaseClient
) {

  const [
    contacts,
    deals,
    properties,
  ] = await Promise.all([

    getDashboardContacts(supabase),

    getDashboardDeals(supabase),

    getDashboardProperties(supabase),

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









export async function getRecentActivities(
  supabase: DashboardSupabaseClient
) {



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

  const actorIds = [
    ...new Set(
      (data ?? [])
        .map(activity => activity.created_by)
        .filter((id): id is string => Boolean(id))
    ),
  ]
  const { data: actors, error: actorsError } = actorIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", actorIds)
    : { data: [], error: null }
  if (actorsError) throw actorsError
  const actorNames = new Map((actors ?? []).map(actor => [actor.id, actor.full_name]))





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

      actorName:
        activity.created_by
          ? actorNames.get(activity.created_by) ?? "Unknown user"
          : "System",


    }


  }

)


}









export async function getUpcomingTasks(
  supabase: DashboardSupabaseClient
){



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



  const today =
    getIndiaDateKey()



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

            ? getTaskDueLabel(
                task.due_date,
                today
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
            ? task.due_date < today
            : false,


      }


    }

  )


}









export async function getHotLeads(
  supabase: DashboardSupabaseClient
){

  const contacts =
    await getDashboardContacts(supabase)



  const hotLeads =
    contacts
      .filter(
        contact =>
          contact.relationshipTypes?.some(
            role =>
              role.toLowerCase() === "buyer"
          )
          &&
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









export async function getNewLeads(
  supabase: DashboardSupabaseClient
){

  const contacts =
    await getDashboardContacts(supabase)



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
  supabase: DashboardSupabaseClient,
  userId: string
){

const today = getIndiaDateKey()

const [
newLeadsResult,
followUpsResult,
activeDealsResult,
upcomingVisitsResult,
tasksResult,
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
    .eq("advisor_id", userId)
    .eq("lead_stage", "new"),

  supabase
    .from("contacts")
    .select(
      "id",
      {
        count:"exact",
        head:true,
      }
    )
    .eq("advisor_id", userId)
    .not("next_follow_up_at", "is", null)
    .lte("next_follow_up_at", `${today}T23:59:59+05:30`),


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
    )
    .eq(
      "advisor_id",
      userId
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
      today
    )
    .neq(
      "status",
      "cancelled"
    )
    .eq(
      "advisor_id",
      userId
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
    userId
  ),


])



return {

  newLeads:
    newLeadsResult.count ?? 0,

  followUps:
    followUpsResult.count ?? 0,

  myTasks:
    tasksResult.count ?? 0,

  activeDeals:
    activeDealsResult.count ?? 0,

  upcomingVisits:
    upcomingVisitsResult.count ?? 0,

}

}



export async function getDealHealthSummary(
  supabase: DashboardSupabaseClient
){


  const deals =
    await getDashboardDeals(supabase)



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

export async function getFollowUpContacts(
  supabase: DashboardSupabaseClient
){

  const contacts =
    await getDashboardContacts(supabase)



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
