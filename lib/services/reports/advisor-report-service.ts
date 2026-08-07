import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getAdvisorReport(){

const supabase =
await createServerSupabaseClient()



const [
contactsResult,
dealsResult,
commissionsResult,
visitsResult,
profilesResult,
] =
await Promise.all([


supabase
.from("contacts")
.select(
`
advisor_id
`
),


supabase
.from("deals")
.select(
`
advisor_id,
stage
`
),


supabase
.from("commissions")
.select(
`
advisor_id,
amount
`
),


supabase
.from("site_visits")
.select(
`
advisor_id
`
),


supabase
.from("profiles")
.select(
`
id,
full_name
`
),


])



if(contactsResult.error)
throw contactsResult.error

if(dealsResult.error)
throw dealsResult.error

if(commissionsResult.error)
throw commissionsResult.error

if(visitsResult.error)
throw visitsResult.error

if(profilesResult.error)
throw profilesResult.error



const advisorMap =
new Map<string,{
name:string
leads:number
deals:number
closedDeals:number
commission:number
siteVisits:number
}>()



const profiles =
profilesResult.data ?? []



function getAdvisor(
id:string
){

if(!advisorMap.has(id)){

const profile =
profiles.find(
item =>
item.id === id
)


advisorMap.set(
id,
{
name:
profile?.full_name ??
"Unknown",

leads:0,
deals:0,
closedDeals:0,
commission:0,
siteVisits:0,
}
)

}


return advisorMap.get(id)!

}



contactsResult.data?.forEach(
contact=>{

if(contact.advisor_id){

getAdvisor(
contact.advisor_id
).leads++

}

}
)



dealsResult.data?.forEach(
deal=>{

if(deal.advisor_id){

const advisor =
getAdvisor(
deal.advisor_id
)


advisor.deals++


if(
deal.stage === "closed_won"
){

advisor.closedDeals++

}

}

}
)



commissionsResult.data?.forEach(
commission=>{

if(commission.advisor_id){

getAdvisor(
commission.advisor_id
).commission +=
Number(
commission.amount ?? 0
)

}

}
)



visitsResult.data?.forEach(
visit=>{

if(visit.advisor_id){

getAdvisor(
visit.advisor_id
).siteVisits++

}

}
)



return {

advisors:
Array.from(
advisorMap.entries()
).map(
([
id,
data
])=>({

id,

...data,

})
),

}

}