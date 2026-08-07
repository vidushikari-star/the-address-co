import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getActivityReport(){

const supabase =
await createServerSupabaseClient()



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
activity_date,
created_by
`
),


supabase
.from("tasks")
.select(
`
status,
assigned_to,
created_at
`
),


])



if(activitiesResult.error){

throw activitiesResult.error

}


if(tasksResult.error){

throw tasksResult.error

}



const activities =
activitiesResult.data ?? []


const tasks =
tasksResult.data ?? []



const activityTypes =
activities.reduce(
(acc,item)=>{

const key =
item.type ?? "unknown"


acc[key] =
(acc[key] ?? 0) + 1


return acc

},
{} as Record<string,number>
)



const completedTasks =
tasks.filter(
task =>
task.status === "completed"
).length



const pendingTasks =
tasks.filter(
task =>
task.status !== "completed"
).length



return {

totalActivities:
activities.length,


completedTasks,

pendingTasks,


totalTasks:
tasks.length,


activityTypes,

}

}