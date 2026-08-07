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



export async function GET(
request:Request
){


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
] =
await Promise.all([


supabase
.from("contacts")
.select(
`
id,
full_name,
lead_source
`
),


supabase
.from("deals")
.select(
`
name,
contact_id,
stage,
closing_price
`
),


])



const contacts =
contactsResult.data ?? []


const rows =
(dealsResult.data ?? [])
.map(
deal=>{


const contact =
contacts.find(
item =>
item.id === deal.contact_id
)


return {

LeadSource:
contact?.lead_source ?? "-",


Contact:
contact?.full_name ?? "-",


Deal:
deal.name ?? "-",


Stage:
deal.stage ?? "-",


ClosingPrice:
deal.closing_price ?? 0,


}

}

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
"Source Performance"
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
'attachment; filename="The_Address_Co_Source_Performance.xlsx"',


},
}
)


}
catch(error){

console.error(error)


return NextResponse.json(
{
error:
"Failed to generate source performance report.",
},
{
status:500,
}
)

}


}