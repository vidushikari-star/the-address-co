import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getSiteVisitReport(){

const supabase =
await createServerSupabaseClient()



const {
data,
error,
} =
await supabase
.from("site_visits")
.select(
`
id,
status,
scheduled_date,
property_id,
deal_id,
advisor_id
`
)



if(error){

throw error

}



const visits =
data ?? []



const statuses =
visits.reduce(
(acc,item)=>{

const key =
item.status ?? "unknown"

acc[key] =
(acc[key] ?? 0) + 1

return acc

},
{} as Record<string,number>
)



const completed =
visits.filter(
visit =>
visit.status === "completed"
).length



const cancelled =
visits.filter(
visit =>
visit.status === "cancelled"
).length



return {

totalVisits:
visits.length,

completed,

cancelled,

conversionRate:
visits.length === 0
? 0
:
Math.round(
(completed / visits.length) * 100
),

statuses,

}

}