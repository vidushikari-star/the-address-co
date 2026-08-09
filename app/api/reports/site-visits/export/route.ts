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


const {
data,
error,
} =
await supabase
.from("site_visits")
.select(
`
id,
scheduled_date,
scheduled_time,
status,
notes,
buyer_feedback,
advisor_id,
contact_id,
property_id,
created_at
`
)



if(error){

throw error

}



const rows =
(data ?? [])
.map(
visit => ({

VisitId:
visit.id,


ScheduledDate:
visit.scheduled_date ?? "-",


ScheduledTime:
visit.scheduled_time ?? "-",


Status:
visit.status ?? "-",


ContactId:
visit.contact_id ?? "-",


PropertyId:
visit.property_id ?? "-",


AdvisorId:
visit.advisor_id ?? "-",


BuyerFeedback:
visit.buyer_feedback ?? "-",


Notes:
visit.notes ?? "-",


CreatedDate:
visit.created_at ?? "-",


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
"Site Visits"
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
'attachment; filename="The_Address_Co_Site_Visits.xlsx"',


},
}
)


}
catch(error){

console.error(error)


return NextResponse.json(
{
error:
"Failed to generate site visit report.",
},
{
status:500,
}
)

}


}
