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
activitiesResult,
tasksResult,
] =
await Promise.all([


supabase
.from("activities")
.select(
`
type,
title,
body,
activity_date,
contact_id,
deal_id,
property_id,
created_at
`
),


supabase
.from("tasks")
.select(
`
title,
status,
priority,
due_date,
assigned_to,
created_at
`
),


])



if(activitiesResult.error)
throw activitiesResult.error


if(tasksResult.error)
throw tasksResult.error



const activityRows =
(activitiesResult.data ?? [])
.map(
activity => ({

Type:
activity.type ?? "-",


Title:
activity.title ?? "-",


Description:
activity.body ?? "-",


ActivityDate:
activity.activity_date ?? "-",


ContactId:
activity.contact_id ?? "-",


DealId:
activity.deal_id ?? "-",


PropertyId:
activity.property_id ?? "-",


CreatedDate:
activity.created_at ?? "-",


})
)



const taskRows =
(tasksResult.data ?? [])
.map(
task => ({

Title:
task.title ?? "-",


Status:
task.status ?? "-",


Priority:
task.priority ?? "-",


DueDate:
task.due_date ?? "-",


AssignedTo:
task.assigned_to ?? "-",


CreatedDate:
task.created_at ?? "-",


})
)



const workbook =
XLSX.utils.book_new()



const activitySheet =
XLSX.utils.json_to_sheet(
activityRows
)



XLSX.utils.book_append_sheet(
workbook,
activitySheet,
"Activities"
)



const taskSheet =
XLSX.utils.json_to_sheet(
taskRows
)



XLSX.utils.book_append_sheet(
workbook,
taskSheet,
"Tasks"
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
'attachment; filename="The_Address_Co_Activity_Productivity.xlsx"',


},
}
)


}
catch(error){

console.error(error)


return NextResponse.json(
{
error:
"Failed to generate activity report.",
},
{
status:500,
}
)

}


}
