import {
  getAllTasks,
} from "@/lib/repositories/task-server-repository"

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"
import { loadAuthenticatedCrmData } from "@/lib/observability/crm-server-diagnostics"

import type {
  CalendarItem,
} from "@/types/calendar"

import {
  formatIndiaTime as formatTaskTime,
} from "@/lib/utils/india-date"



function formatIndiaTime(
  value:string
){

return new Date(value)
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

const supabase = await createServerSupabaseClient()
const crm = createAuthenticatedCrmReadRepository(supabase)

const [

tasks,

siteVisits,

calendarEvents,

] =
await loadAuthenticatedCrmData(
  { route: "/calendar", area: "calendar CRM data" },
  () => Promise.all([

getAllTasks(),

crm.getAllSiteVisits(),

getSharedCalendarEvents(supabase),

  ]),
)





const taskItems: CalendarItem[] =


tasks

.filter(
task =>
task.dueDate &&
!task.completed &&
!task.archived
)

.map(
task => ({

id:
`task-${task.id}`,

title:
task.title,

date:
task.dueDate!,


time:
formatTaskTime(task.dueTime) ?? undefined,


type:
"task",


status:
"pending",


contactId:
task.contactId,


dealId:
task.dealId,


assignedTo:
task.advisorName
?? "Unassigned",


assignedToId:
task.assignedTo
?? undefined,


url:
task.dealId
?
`/deals/${task.dealId}`
:
task.contactId
?
`/contacts/${task.contactId}`
:
"/tasks",

})
)






const siteVisitItems: CalendarItem[] =


siteVisits.map(
visit => {


const dateTime =
`${visit.scheduledDate}T${
visit.scheduledTime || "00:00"
}:00+05:30`



return {

id:
`visit-${visit.id}`,


title:
"Site Visit",


date:
new Date(
dateTime
)
.toISOString(),


time:
visit.scheduledTime || "",


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


assignedTo:
visit.advisorName
?? "Unassigned",


assignedToId:
visit.advisorId
?? undefined,


url:
visit.dealId
?
`/deals/${visit.dealId}`
:
visit.contactId
?
`/contacts/${visit.contactId}`
:
"/calendar",

}

}

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
event.contact_id
?? undefined,


propertyId:
event.property_id
?? undefined,


dealId:
event.deal_id
?? undefined,


contactName:
event.contact_name
?? undefined,


propertyName:
event.property_name
?? undefined,


dealName:
event.deal_name
?? undefined,


assignedTo:
event.assigned_name
?? "Unassigned",


assignedToId:
event.assigned_to
?? undefined,


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

(a,b)=>

new Date(
a.date
).getTime()

-

new Date(
b.date
).getTime()

)

}







async function getSharedCalendarEvents(
supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
){



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
),

assigned:user_profiles!calendar_events_assigned_to_fkey(
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


assigned_name:
event.assigned?.name
??
null,


})

)

}
