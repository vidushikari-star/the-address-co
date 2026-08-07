import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Props = {

total:number

won:number

lost:number

conversionRate:number

stages:Record<string,number>

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



export function ConversionReport({

total,

won,

lost,

conversionRate,

stages,

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

Conversion Funnel

</h2>


<p className="
mt-1
text-sm
text-muted-foreground
">

Track movement of opportunities through the sales funnel.

</p>


</div>



<Link

href="/api/reports/conversion/export"

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

title="Total Deals"

value={
total.toString()
}

/>


<ReportCard

title="Won"

value={
won.toString()
}

/>


<ReportCard

title="Lost"

value={
lost.toString()
}

/>


<ReportCard

title="Conversion Rate"

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

Pipeline Stages

</h3>


<div className="
space-y-3
">


{
Object.entries(stages)
.map(
([stage,count])=>(

<div

key={stage}

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

{formatLabel(stage)}

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


</div>


</div>


</section>

)

}