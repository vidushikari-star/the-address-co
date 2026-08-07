import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Props = {

totalActivities:number

totalTasks:number

completedTasks:number

pendingTasks:number

activityTypes:Record<string,number>

}



function formatLabel(
value:string
){

return value
.replaceAll("_"," ")
.replace(
  /\b\w/g,
  c =>
    c.toUpperCase()
)

}



export function ActivityReport({

totalActivities,

totalTasks,

completedTasks,

pendingTasks,

activityTypes,

}:Props){


return (

<section className="
space-y-6
">


<div className="
flex
flex-col
gap-3
sm:flex-row
sm:items-start
sm:justify-between
">


<div>

<h2 className="
text-xl
font-semibold
">

Activity & Productivity

</h2>


<p className="
mt-1
text-sm
text-muted-foreground
">

Track CRM activity, tasks and team productivity.

</p>


</div>



<Link

href="/api/reports/activity/export"

className="
inline-flex
w-full
items-center
justify-center
rounded-lg
border
px-4
py-2
text-sm
font-medium
hover:bg-muted
sm:w-auto
"

>

Download Excel

</Link>


</div>






<div className="
grid
gap-4
sm:grid-cols-4
">


<ReportCard

title="Activities"

value={
totalActivities.toString()
}

/>


<ReportCard

title="Tasks"

value={
totalTasks.toString()
}

/>


<ReportCard

title="Completed Tasks"

value={
completedTasks.toString()
}

/>


<ReportCard

title="Pending Tasks"

value={
pendingTasks.toString()
}

/>


</div>






<div className="
rounded-2xl
border
p-6
">


<h3 className="
mb-4
font-semibold
">

Activity Breakdown

</h3>



<div className="
space-y-3
">


{
Object.entries(activityTypes)
.map(
([type,count]) => (

<div

key={type}

className="
flex
items-center
justify-between
rounded-xl
border
px-4
py-3
"

>

<span className="
text-sm
font-medium
">

{formatLabel(type)}

</span>


<span className="
font-semibold
">

{count}

</span>


</div>

)

)

}



{
Object.keys(activityTypes).length === 0 && (

<p className="
text-sm
text-muted-foreground
">

No activity data available.

</p>

)

}


</div>


</div>


</section>

)

}