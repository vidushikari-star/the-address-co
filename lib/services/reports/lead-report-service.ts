import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getLeadReport(){

const supabase =
await createServerSupabaseClient()



const {
data,
error,
} =
await supabase
.from("contacts")
.select(
`
id,
full_name,
lead_source,
lead_stage,
lead_temperature,
next_follow_up_at,
budget_min,
budget_max,
locations,
property_type,
timeline,
created_at,
relationship_types
`
)



if(error){

throw error

}



const leads =
(data ?? []).filter(
lead =>
  lead.relationship_types?.includes("buyer")
)



const temperature =
leads.reduce(
(
acc,
lead
)=>{

const key =
lead.lead_temperature ?? "unknown"


acc[key] =
(acc[key] ?? 0) + 1


return acc

},
{} as Record<string,number>
)



const sources =
leads.reduce(
(
acc,
lead
)=>{

const key =
lead.lead_source ?? "unknown"


acc[key] =
(acc[key] ?? 0) + 1


return acc

},
{} as Record<string,number>
)



const pendingFollowUps =
leads.filter(
lead =>
lead.next_follow_up_at &&
new Date(
lead.next_follow_up_at
) <= new Date()
).length



return {

totalLeads:
leads.length,


hotLeads:
leads.filter(
lead =>
lead.lead_temperature === "hot"
).length,


warmLeads:
leads.filter(
lead =>
lead.lead_temperature === "warm"
).length,


pendingFollowUps,


temperature,


sources,

}

}
