import {
NextResponse,
} from "next/server"

import * as XLSX from "xlsx"

import {
getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function GET(){

const user =
await getServerUserProfile()


if(!user){

return NextResponse.json(
{
error:"Unauthorized",
},
{
status:401,
}
)

}


if(user.role !== "admin"){

return NextResponse.json(
{
error:"Forbidden",
},
{
status:403,
}
)

}



const supabase =
await createServerSupabaseClient()



try {


const [
contactsResult,
dealsResult,
commissionsResult,
visitsResult,
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


])



const advisorMap =
new Map()



function advisor(
id:string
){

if(!advisorMap.has(id)){

advisorMap.set(
id,
{
Leads:0,
Deals:0,
ClosedDeals:0,
Commission:0,
SiteVisits:0,
}
)

}

return advisorMap.get(id)

}



contactsResult.data?.forEach(
item=>{

if(item.advisor_id){

advisor(
item.advisor_id
).Leads++

}

}
)



dealsResult.data?.forEach(
item=>{

if(item.advisor_id){

const row =
advisor(
item.advisor_id
)

row.Deals++

if(
item.stage === "closed_won"
){

row.ClosedDeals++

}

}

}
)



commissionsResult.data?.forEach(
item=>{

if(item.advisor_id){

advisor(
item.advisor_id
).Commission +=
Number(
item.amount ?? 0
)

}

}
)



visitsResult.data?.forEach(
item=>{

if(item.advisor_id){

advisor(
item.advisor_id
).SiteVisits++

}

}
)



const rows =
Array.from(
advisorMap.values()
)



const workbook =
XLSX.utils.book_new()



const sheet =
XLSX.utils.json_to_sheet(
rows
)



XLSX.utils.book_append_sheet(
workbook,
sheet,
"Advisors"
)



const buffer =
XLSX.write(
workbook,
{
type:"buffer",
bookType:"xlsx",
}
)



return new NextResponse(
buffer,
{
headers:{

"Content-Type":
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

"Content-Disposition":
'attachment; filename="The_Address_Co_Advisor_Performance.xlsx"',

},
}
)


}
catch(error){

console.error(error)

return NextResponse.json(
{
error:
"Failed to generate advisor report.",
},
{
status:500,
}
)

}

}
