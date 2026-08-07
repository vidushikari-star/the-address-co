import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Props = {

totalVisits:number

completed:number

cancelled:number

conversionRate:number

statuses:Record<string,number>

}



function formatLabel(
value:string
){

return value
.replaceAll("_"," ")
.replace(
 /\b\w/g,
 c=>c.toUpperCase()
)

}



export function SiteVisitReport({

totalVisits,

completed,

cancelled,

conversionRate,

statuses,

}:Props){

return (

<section className="
space-y-6
">


<div className="
flex
justify-between
gap-3
">


<div>

<h2 className="
text-xl
font-semibold
">

Site Visit Analytics

</h2>


<p className="
text-sm
text-muted-foreground
">

Track property visits and conversion performance.

</p>

</div>



<Link

href="/api/reports/site-visits/export"

className="
rounded-lg
border
px-4
py-2
text-sm
hover:bg-muted
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
title="Total Visits"
value={totalVisits.toString()}
/>


<ReportCard
title="Completed"
value={completed.toString()}
/>


<ReportCard
title="Cancelled"
value={cancelled.toString()}
/>


<ReportCard
title="Conversion"
value={`${conversionRate}%`}
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

Visit Status

</h3>


<div className="
space-y-3
">

{
Object.entries(statuses)
.map(
([status,count])=>(

<div

key={status}

className="
flex
justify-between
rounded-xl
border
px-4
py-3
"

>

<span>
{formatLabel(status)}
</span>

<span className="font-semibold">
{count}
</span>

</div>

)

)

}

</div>

</div>


</section>

)

}