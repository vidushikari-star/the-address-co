import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Props = {

totalLeads:number

hotLeads:number

warmLeads:number

pendingFollowUps:number

temperature:Record<string,number>

sources:Record<string,number>

}



function formatLabel(
value:string
){

return value
.replaceAll("_"," ")
.replace(
  /\b\w/g,
  char =>
    char.toUpperCase()
)

}



export function LeadReport({

totalLeads,

hotLeads,

warmLeads,

pendingFollowUps,

temperature,

sources,

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

Lead Analytics

</h2>


<p className="
mt-1
text-sm
text-muted-foreground
">

Overview of lead sources, buyer quality and pending follow-ups.

</p>


</div>



<Link

href="/api/reports/leads/export"

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
transition-colors
hover:bg-muted
sm:w-auto
"

>

Download Excel

</Link>


</div>






<div className="
grid
grid-cols-1
gap-4
sm:grid-cols-2
xl:grid-cols-4
">


<ReportCard

title="Total Leads"

value={
totalLeads.toString()
}

description="Total CRM contacts"

/>



<ReportCard

title="Hot Leads"

value={
hotLeads.toString()
}

description="High intent buyers"

/>



<ReportCard

title="Warm Leads"

value={
warmLeads.toString()
}

description="Potential opportunities"

/>



<ReportCard

title="Pending Follow Ups"

value={
pendingFollowUps.toString()
}

description="Needs attention"

/>



</div>







<div className="
grid
gap-6
xl:grid-cols-2
">



<div className="
rounded-2xl
border
p-6
">


<h3 className="
mb-4
font-semibold
">

Lead Sources

</h3>


<div className="
space-y-3
">


{
Object.entries(sources)
.map(
([source,count]) => (

<div

key={source}

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

{formatLabel(source)}

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
Object.keys(sources).length === 0 && (

<p className="
text-sm
text-muted-foreground
">

No lead source data available.

</p>

)

}


</div>


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

Lead Temperature

</h3>


<div className="
space-y-3
">


{
Object.entries(temperature)
.map(
([status,count]) => (

<div

key={status}

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

{formatLabel(status)}

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
Object.keys(temperature).length === 0 && (

<p className="
text-sm
text-muted-foreground
">

No lead temperature data available.

</p>

)

}


</div>


</div>


</div>


</section>

)

}