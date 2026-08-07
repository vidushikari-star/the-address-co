import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Advisor = {

id:string

name:string

leads:number

deals:number

closedDeals:number

commission:number

siteVisits:number

}



type Props = {

advisors:Advisor[]

}



function money(
value:number
){

return `₹${value.toLocaleString("en-IN")}`

}



export function AdvisorReport({
advisors,
}:Props){


const totalLeads =
advisors.reduce(
(sum,item)=>
sum + item.leads,
0
)


const totalDeals =
advisors.reduce(
(sum,item)=>
sum + item.deals,
0
)


const totalCommission =
advisors.reduce(
(sum,item)=>
sum + item.commission,
0
)



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

Advisor Performance

</h2>


<p className="
mt-1
text-sm
text-muted-foreground
">

Lead handling, deal activity and commission performance.

</p>


</div>



<Link

href="/api/reports/advisors/export"

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

title="Total Deals"

value={
totalDeals.toString()
}

/>


<ReportCard

title="Commission Generated"

value={
money(totalCommission)
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

Advisor Summary

</h3>



<div className="
space-y-3
">


{
advisors.map(
advisor => (

<div

key={
advisor.id
}

className="
rounded-xl
border
p-4
"

>

    <p className="
mb-3
font-semibold
">
{advisor.name}
</p>

<div className="
grid
gap-3
sm:grid-cols-5
">


<div>

<p className="
text-xs
text-muted-foreground
">

Leads

</p>

<p className="
font-semibold
">

{advisor.leads}

</p>

</div>



<div>

<p className="
text-xs
text-muted-foreground
">

Deals

</p>

<p className="
font-semibold
">

{advisor.deals}

</p>

</div>



<div>

<p className="
text-xs
text-muted-foreground
">

Closed

</p>

<p className="
font-semibold
">

{advisor.closedDeals}

</p>

</div>



<div>

<p className="
text-xs
text-muted-foreground
">

Site Visits

</p>

<p className="
font-semibold
">

{advisor.siteVisits}

</p>

</div>



<div>

<p className="
text-xs
text-muted-foreground
">

Commission

</p>

<p className="
font-semibold
">

{money(advisor.commission)}

</p>

</div>



</div>

</div>

)

)

}


{
advisors.length === 0 && (

<p className="
text-sm
text-muted-foreground
">

No advisor data available.

</p>

)

}


</div>


</div>


</section>

)

}