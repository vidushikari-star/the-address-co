import {
  getAllTasks,
} from "@/lib/repositories/task-server-repository"


import {
  getAllSiteVisits,
} from "@/lib/repositories/site-visit-repository"


import type {
  CalendarItem,
} from "@/types/calendar"







export async function getCalendarItems(): Promise<CalendarItem[]> {


  const [

    tasks,

    siteVisits,

  ] =
  await Promise.all([


    getAllTasks(),


    getAllSiteVisits(),


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









  return [

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