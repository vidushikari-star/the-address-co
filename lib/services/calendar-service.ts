import {
  getAllTasks,
} from "@/lib/repositories/task-server-repository"


import {
  getAllSiteVisits,
} from "@/lib/repositories/site-visit-repository"


import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"


import type {
  CalendarItem,
} from "@/types/calendar"







function formatIndiaTime(
  value:string
){

  return new Date(
    value
  )
  .toLocaleTimeString(
    "en-IN",
    {
      timeZone:"Asia/Kolkata",
      hour:"2-digit",
      minute:"2-digit",
      hour12:true,
    }
  )

}







export async function getCalendarItems(): Promise<CalendarItem[]> {


  const [

    tasks,

    siteVisits,

    calendarEvents,

  ] =
  await Promise.all([


    getAllTasks(),


    getAllSiteVisits(),


    getSharedCalendarEvents(),


  ])







  const taskItems: CalendarItem[] =

    tasks

    .filter(
      task =>
        task.dueDate
    )

    .map(
      task => ({

        id:
          `task-${task.id}`,

        title:
          task.title,

        date:
          task.dueDate!.toISOString(),

        type:
          "task",

        status:
          task.completed
            ? "completed"
            : "pending",

        contactId:
          task.contactId,

        dealId:
          task.dealId,

        assignedTo:
          task.assignedTo,

        url:
          task.dealId
            ? `/deals/${task.dealId}`
            : task.contactId
              ? `/contacts/${task.contactId}`
              : "/tasks",

      })
    )









  const siteVisitItems: CalendarItem[] =

    siteVisits

    .map(
      visit => ({

        id:
          `visit-${visit.id}`,

        title:
          "Site Visit",

        date:
          visit.scheduledDate,

        time:
          visit.scheduledTime,

        type:
          "site_visit",

        status:
          visit.status,

        contactId:
          visit.contactId,

        dealId:
          visit.dealId,

        propertyId:
          visit.propertyId,

        contactName:
          visit.contactName,

        propertyName:
          visit.propertyName,

        url:
          visit.dealId
            ? `/deals/${visit.dealId}`
            : "/calendar",

      })
    )









  const eventItems: CalendarItem[] =

    calendarEvents.map(
      event => ({

        id:
          `event-${event.id}`,

        title:
          event.title,


        date:
          event.start_time,


        time:
          formatIndiaTime(
            event.start_time
          ),


        type:
          "activity",


        status:
          event.status,


        contactId:
          event.contact_id ?? undefined,


        propertyId:
          event.property_id ?? undefined,


        dealId:
          event.deal_id ?? undefined,


        contactName:
          event.contact_name ?? undefined,


        propertyName:
          event.property_name ?? undefined,


        dealName:
          event.deal_name ?? undefined,


        assignedTo:
          event.assigned_to ?? undefined,


        url:
          `/calendar/${event.id}`,

      })

    )









  return [

    ...eventItems,

    ...taskItems,

    ...siteVisitItems,

  ]

  .sort(

    (a,b) =>

      new Date(
        a.date
      ).getTime()

      -

      new Date(
        b.date
      ).getTime()

  )


}









async function getSharedCalendarEvents(){


  const supabase =
    await createServerSupabaseClient()





  const {
    data,
    error,
  } =
    await supabase
      .from("calendar_events")
      .select(`
        *,
        
        contacts:contact_id(
          full_name
        ),

        properties:property_id(
          name
        ),

        deals:deal_id(
          name
        )

      `)
      .order(
        "start_time",
        {
          ascending:true,
        }
      )



  if(error){

    console.error(
      "Failed loading calendar events",
      error
    )

    return []

  }





  return (

    data ?? []

  )

  .map(
    event => ({

      ...event,

      contact_name:
        event.contacts?.full_name
        ??
        null,


      property_name:
        event.properties?.name
        ??
        null,


      deal_name:
        event.deals?.name
        ??
        null,

    })

  )

}