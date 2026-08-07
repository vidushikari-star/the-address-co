import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Source = {

source:string

leads:number

deals:number

wonDeals:number

revenue:number

}



type Props = {

sources:Source[]

}



function money(
value:number
){

return `₹${value.toLocaleString("en-IN")}`

}



function label(
value:string
){

return value
.replaceAll("_"," ")
.replace(
 /\b\w/g,
 c=>c.toUpperCase()
)

}



export function SourcePerformanceReport({

sources,

}:Props){


const totalLeads =
sources.reduce(
(sum,item)=>
sum + item.leads,
0
)


const totalRevenue =
sources.reduce(
(sum,item)=>
sum + item.revenue,
0
)


const bestSource =
sources
.sort(
(a,b)=>
b.wonDeals-a.wonDeals
)[0]



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

Lead Source Performance

</h2>


<p className="
mt-1
text-sm
text-muted-foreground
">

Measure which channels generate qualified business.

</p>


</div>



<Link

href="/api/reports/source-performance/export"

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
sm:grid-cols-3
">


<ReportCard

title="Total Leads"

value={
totalLeads.toString()
}

/>


<ReportCard

title="Revenue Generated"

value={
money(totalRevenue)
}

/>


<ReportCard

title="Best Source"

value={
bestSource
?
label(bestSource.source)
:
"-"
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

Source Breakdown

</h3>



<div className="
space-y-3
">


{
sources
.sort(
(a,b)=>
b.leads-a.leads
)
.map(
source=>(


<div

key={
source.source
}

className="
rounded-xl
border
p-4
"

>


<div className="
flex
justify-between
">

<span className="font-medium">

{label(source.source)}

</span>


<span>

{source.leads} leads

</span>


</div>



<div className="
mt-2
text-sm
text-muted-foreground
">

Deals: {source.deals}
&nbsp; | &nbsp;
Won: {source.wonDeals}
&nbsp; | &nbsp;
Revenue: {money(source.revenue)}

</div>


</div>


)

)

}


</div>


</div>


</section>

)

}