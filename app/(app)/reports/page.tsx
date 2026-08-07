import Link from "next/link"
import { redirect } from "next/navigation"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"

import { getCommissions } from "@/lib/repositories/commission-repository"
import { getExpenses } from "@/lib/repositories/expense-repository"
import { getAllCommissionDistributions } from "@/lib/repositories/commission-distribution-repository"

import { PnLReport } from "@/components/reports/pnl-report"
import { CommissionReport } from "@/components/reports/commission-report"
import { SalesReport } from "@/components/reports/sales-report"
import { PartnerSettlement } from "@/components/reports/partner-settlement"
import { OverviewReport } from "@/components/reports/overview-report"

import { getOverviewReport } from "@/lib/services/reports/overview-report-service"

import {
ReportRange,
} from "@/lib/reports/report-date-utils"

import {
filterByDate,
} from "@/lib/reports/filter-report-data"

import {
PipelineReport,
} from "@/components/reports/pipeline-report"

import {
getPipelineReport,
} from "@/lib/services/reports/pipeline-report-service"

import {
LeadReport,
} from "@/components/reports/lead-report"

import {
getLeadReport,
} from "@/lib/services/reports/lead-report-service"

import {
InventoryReport,
} from "@/components/reports/inventory-report"

import {
getInventoryReport,
} from "@/lib/services/reports/inventory-report-service"

import {
AdvisorReport,
} from "@/components/reports/advisor-report"

import {
getAdvisorReport,
} from "@/lib/services/reports/advisor-report-service"

import {
BuyerDemandReport,
} from "@/components/reports/buyer-demand-report"

import {
getBuyerDemandReport,
} from "@/lib/services/reports/buyer-demand-report-service"

import {
SiteVisitReport,
} from "@/components/reports/site-visit-report"

import {
getSiteVisitReport,
} from "@/lib/services/reports/site-visit-report-service"


import {
ActivityReport,
} from "@/components/reports/activity-report"

import {
getActivityReport,
} from "@/lib/services/reports/activity-report-service"


import {
ConversionReport,
} from "@/components/reports/conversion-report"

import {
getConversionReport,
} from "@/lib/services/reports/conversion-report-service"


import {
SourcePerformanceReport,
} from "@/components/reports/source-performance-report"

import {
getSourcePerformanceReport,
} from "@/lib/services/reports/source-performance-report-service"



type Props = {
searchParams: Promise<{
range?: string
}>
}



export default async function ReportsPage({
searchParams,
}: Props) {


const user =
await getServerUserProfile()


if (
!user ||
user.role !== "admin"
) {

redirect("/dashboard")

}



const params =
await searchParams


const range =
(params.range as ReportRange) ??
"all"



const [
commissions,
expenses,
distributions,
overview,
pipeline,
leads,
inventory,
advisors,
buyerDemand,
siteVisits,
activity,
conversion,
sourcePerformance,
] = await Promise.all([

getCommissions(),

getExpenses(),

getAllCommissionDistributions(),

getOverviewReport(),

getPipelineReport(),

getLeadReport(),

getInventoryReport(),

getAdvisorReport(),

getBuyerDemandReport(),

getSiteVisitReport(),

getActivityReport(),

getConversionReport(),

getSourcePerformanceReport(),

])



const filteredCommissions =
filterByDate(
commissions,
range
)



const filteredExpenses =
filterByDate(
expenses,
range
)



const filteredDistributions =
filterByDate(
distributions,
range
)



const filterButton = (
label: string,
value: ReportRange
) => {

const active =
range === value


return (

<Link
href={`/reports?range=${value}`}
className={`
rounded-lg
border
px-4
py-2
text-sm
transition-colors
${
active
? "bg-primary text-primary-foreground border-primary"
: "hover:bg-muted"
}
`}
>

{label}

</Link>

)

}



return (

<div className="
space-y-6
">


<div>

<h1 className="
text-2xl
font-semibold
">

Reports

</h1>


<p className="
mt-1
text-muted-foreground
">

Financial and business performance reports.

</p>


</div>



<div className="
flex
flex-wrap
gap-2
">

{filterButton("All", "all")}

{filterButton("This Month", "month")}

{filterButton("This Year", "year")}

</div>




<OverviewReport
{...overview}
/>

<PipelineReport
{...pipeline}
/>

<LeadReport
  {...leads}
/>

<InventoryReport
  {...inventory}
/>

<AdvisorReport
  {...advisors}
/>

<BuyerDemandReport
  {...buyerDemand}
/>

<SiteVisitReport
  {...siteVisits}
/>


<ActivityReport
  {...activity}
/>


<ConversionReport
  {...conversion}
/>


<SourcePerformanceReport
  {...sourcePerformance}
/>

<PnLReport

commissions={
filteredCommissions
}

expenses={
filteredExpenses
}

/>



<CommissionReport

commissions={
filteredCommissions
}

/>



<SalesReport

commissions={
filteredCommissions
}

/>



<PartnerSettlement

distributions={
filteredDistributions
}

/>


</div>

)

}