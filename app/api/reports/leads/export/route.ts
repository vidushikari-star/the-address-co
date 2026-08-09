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



export async function GET() {


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



let leads



try {


const {
data,
error,
} =
await supabase
.from("contacts")
.select(
`
full_name,
email,
phone,
lead_source,
lead_stage,
lead_temperature,
budget_min,
budget_max,
currency,
locations,
property_type,
timeline,
next_follow_up_at,
created_at
`
)



if(error){

throw error

}


leads =
data ?? []


}
catch(error){


console.error(error)


return NextResponse.json(
{
error:
"Failed to generate lead report.",
},
{
status:500,
}
)

}




const rows =
leads.map(
lead => ({

Name:
lead.full_name ?? "-",


Email:
lead.email ?? "-",


Phone:
lead.phone ?? "-",


Source:
lead.lead_source ?? "-",


Stage:
lead.lead_stage ?? "-",


Temperature:
lead.lead_temperature ?? "-",


BudgetMin:
lead.budget_min ?? "-",


BudgetMax:
lead.budget_max ?? "-",


Currency:
lead.currency ?? "-",


Locations:
Array.isArray(
lead.locations
)
?
lead.locations.join(", ")
:
"-",


PropertyType:
lead.property_type ?? "-",


Timeline:
lead.timeline ?? "-",


NextFollowUp:
lead.next_follow_up_at ?? "-",


CreatedDate:
lead.created_at ?? "-",


})
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
"Leads"
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
'attachment; filename="The_Address_Co_Lead_Analytics.xlsx"',


},

}
)


}
