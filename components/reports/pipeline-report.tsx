import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Props = {

activeDeals:number

pipelineValue:number

weightedPipeline:number

closedWonRevenue:number

stages:Record<string,number>

}



function money(
value:number
){

return `₹${value.toLocaleString("en-IN")}`

}



function formatStage(
stage:string
){

return stage
.replaceAll("_"," ")
.replace(
  /\b\w/g,
  char =>
    char.toUpperCase()
)

}



export function PipelineReport({

activeDeals,

pipelineValue,

weightedPipeline,

closedWonRevenue,

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

Sales Pipeline

</h2>


<p className="
mt-1
text-sm
text-muted-foreground
">

Overview of active opportunities, deal stages and weighted sales pipeline.

</p>


</div>




<Link

href="/api/reports/pipeline/export"

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

title="Active Deals"

value={
activeDeals.toString()
}

description="Open opportunities"

/>



<ReportCard

title="Pipeline Value"

value={
money(pipelineValue)
}

description="Total active deal value"

/>



<ReportCard

title="Weighted Pipeline"

value={
money(weightedPipeline)
}

description="Probability adjusted value"

/>



<ReportCard

title="Closed Won"

value={
money(closedWonRevenue)
}

description="Completed sales value"

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

Deals by Stage

</h3>



<div className="
space-y-3
">


{
Object.entries(stages)
.map(
([stage,count]) => (

<div

key={stage}

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

{formatStage(stage)}

</span>



<span className="
text-sm
font-semibold
">

{count}

</span>


</div>

)

)

}



{
Object.keys(stages).length === 0 && (

<p className="
text-sm
text-muted-foreground
">

No deals available.

</p>

)

}



</div>


</div>


</section>

)

}