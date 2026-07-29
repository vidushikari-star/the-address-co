// lib/services/calendar-service.ts

import {
  getAllTasks,
} from "@/lib/repositories/task-server-repository"


import {
  getAllSiteVisits,
} from "@/lib/repositories/site-visit-repository"


import {
  supabase,
} from "@/lib/supabase/client"


import type {
  CalendarItem,
} from "@/types/calendar"





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
          task.dueDate!
            .toISOString(),


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

    calendarEvents

    .map(
      event => ({

        id:
          `event-${event.id}`,


        title:
          event.title,


        date:
          event.start_time,


        time:
          new Date(
            event.start_time
          )
          .toLocaleTimeString(
            "en-IN",
            {
              hour:"2-digit",
              minute:"2-digit",
            }
          ),


        type:
          "activity",


        status:
          event.status,


        contactId:
          event.contact_id,


        dealId:
          event.deal_id,


        propertyId:
          event.property_id,


        assignedTo:
          event.assigned_to,


        url:
          "/calendar",

      })
    )









  return [

    ...eventItems,

    ...taskItems,

    ...siteVisitItems,

  ].sort(

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


  const {
    data,
    error,
  } =
    await supabase
      .from("calendar_events")
      .select("*")
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



  return data ?? []

}