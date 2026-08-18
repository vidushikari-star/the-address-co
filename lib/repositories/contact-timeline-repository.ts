import {
  supabase,
} from "@/lib/supabase/client"


import type {
  Activity,
} from "@/types/activity"



export type TimelineEvent = {

  id:string

  type:
    Activity["type"]

  title:string

  body?:string

  date:string

  actorName?:string

}





export async function getContactTimeline(
  contactId:string
):Promise<TimelineEvent[]> {


  const events:TimelineEvent[] = []



  /*
    ACTIVITIES
  */


  const {
    data:activities,
    error:activityError,
  } =
  await supabase
    .from("activities")
    .select("*, actor:profiles!activities_created_by_fkey(full_name)")
    .eq(
      "contact_id",
      contactId
    )


  if(activityError){
    throw activityError
  }



  ;(
    activities ?? []
  )
  .forEach(
    activity => {

      events.push({

        id:
          activity.id,

        type:
          activity.type,

        title:
          activity.title,

        body:
          activity.body ??
          activity.description,

        date:
          activity.activity_date ??
          activity.created_at,

        actorName:
          activity.actor?.full_name
          ?? (
            activity.created_by
            ? "Unknown user"
            : "System"
          ),

      })

    }
  )




  /*
    COMMISSIONS
  */


  const {
    data:commissions,
  } =
  await supabase
    .from("commissions")
    .select(`
      id,
      amount,
      commission_role,
      notes,
      created_at
    `)
    .eq(
      "contact_id",
      contactId
    )




  ;(
    commissions ?? []
  )
  .forEach(
    commission => {

      events.push({

        id:
          `commission-${commission.id}`,

        type:
          "commission",

        title:
          `${
            commission.commission_role
            ??
            "Commission"
          } Commission Created`,

        body:
          commission.notes
          ??
          `₹${Number(
            commission.amount
          ).toLocaleString(
            "en-IN"
          )}`,

        date:
          commission.created_at,

      })

    }
  )


/*
  PROPERTY RELATIONSHIPS
*/


const {
  data:propertyContacts,
} =
await supabase
  .from("property_contacts")
  .select(`
    id,
    relationship_type,
    created_at,
    properties(
      name
    )
  `)
  .eq(
    "contact_id",
    contactId
  )



;(propertyContacts ?? [])
.forEach(
  relationship => {

    const property =
      Array.isArray(
        relationship.properties
      )
        ? relationship.properties[0]
        : relationship.properties


    events.push({

      id:
        `property-${relationship.id}`,

      type:
        "property_viewed",

      title:
        `Added as ${
          relationship.relationship_type
            .replace("_"," ")
        }`,

      body:
        property?.name ??
        "Property relationship added",

      date:
        relationship.created_at,

    })

  }
)

/*
  DEAL EVENTS
*/


const {
  data:deals,
} =
await supabase
  .from("deals")
  .select(`
    id,
    name,
    stage,
    property_price,
    closing_price,
    created_at,
    closed_at,
    lost_reason
  `)
  .eq(
    "contact_id",
    contactId
  )



;(deals ?? [])
.forEach(
  deal => {


    if(
      deal.closed_at
    ){

      events.push({

        id:
          `deal-closed-${deal.id}`,

        type:
          "deal_closed",

        title:
          "Deal Closed",

        body:
          `${deal.name}
₹${
  Number(
    deal.closing_price ??
    deal.property_price ??
    0
  )
  .toLocaleString("en-IN")
}`,

        date:
          deal.closed_at,

      })

    }


    else {

      events.push({

        id:
          `deal-${deal.id}`,

        type:
          "deal_stage_changed",

        title:
          `Deal ${deal.stage}`,

        body:
          deal.name,

        date:
          deal.created_at,

      })

    }


    if(
      deal.lost_reason
    ){

      events.push({

        id:
          `deal-lost-${deal.id}`,

        type:
          "deal_stage_changed",

        title:
          "Deal Lost",

        body:
          deal.lost_reason,

        date:
          deal.created_at,

      })

    }


  }
)

  /*
    SORT NEWEST FIRST
  */


  return events.sort(
    (a,b)=>

      new Date(b.date).getTime()
      -
      new Date(a.date).getTime()

  )


}
