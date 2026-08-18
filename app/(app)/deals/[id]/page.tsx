import { notFound } from "next/navigation"
import Link from "next/link"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"
import { loadAuthenticatedCrmData } from "@/lib/observability/crm-server-diagnostics"

import {
  getCommissionsByDealId,
} from "@/lib/repositories/commission-server-repository"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
  DealActivityTimeline,
} from "@/components/deals/deal-activity-timeline"

import {
  DealActions,
} from "@/components/deals/deal-actions"

import {
  DealStageSelect,
} from "@/components/deals/deal-stage-select"

import {
  DealNotes,
} from "@/components/deals/deal-notes"

import {
  DealTasks,
} from "@/components/deals/deal-tasks"

import {
  SharedProperties,
} from "@/components/deals/shared-properties"

import {
  SiteVisitsSection,
} from "@/components/deals/site-visits-section"

import {
  DealCommission,
} from "@/components/deals/deal-commission"

import {
  DealHealth,
} from "@/components/deals/deal-health"

import {
  Badge,
} from "@/components/ui/badge"


export const dynamic = "force-dynamic"





type Props = {

  params: Promise<{
    id:string
  }>

}







export default async function DealPage({

  params,

}:Props){


  const {
    id,
  } =
  await params





  const user =
    await getServerUserProfile()

  const crm = createAuthenticatedCrmReadRepository(await createServerSupabaseClient())




  const deal =
    await loadAuthenticatedCrmData(
      { route: "/deals/[id]", area: "deal detail", userId: user?.id },
      () => crm.getDealById(id),
    )





  if(!deal){

    notFound()

  }







  const [

    contact,

    property,

    activities,

    sharedProperties,

    siteVisits,

    commissions,

    propertySources,

  ] =

  await loadAuthenticatedCrmData(
    { route: "/deals/[id]", area: "deal detail related data", userId: user?.id },
    () => Promise.all([

    


    crm.getContactById(
      deal.contactId
    ),


    crm.getPropertyById(
      deal.propertyId
    ),


    crm.getActivitiesByDealId(
      deal.id
    ),


    crm.getPropertySharesByDealId(
      deal.id
    ),


    crm.getSiteVisitsByDealId(
      deal.id
    ),


    getCommissionsByDealId(
      deal.id
    ),


    crm.getPropertySources(
      deal.propertyId
    ),


    ]),
  )

  if(!contact){
  notFound()
}








  const paidDistributionAmount =

    await loadAuthenticatedCrmData(
      { route: "/deals/[id]", area: "deal commission distributions", userId: user?.id },
      () => crm.getPaidDistributionAmount(

      commissions.map(

        commission =>
          commission.id

      )

      ),
    )









  const sharedPropertyDetails =

    await loadAuthenticatedCrmData(
      { route: "/deals/[id]", area: "shared property details", userId: user?.id },
      () => crm.getPropertiesByIds(

      sharedProperties.map(

        item =>
          item.propertyId

      )

      ),
    )









  const siteVisitProperties =

    await loadAuthenticatedCrmData(
      { route: "/deals/[id]", area: "site-visit property details", userId: user?.id },
      () => crm.getPropertiesByIds(

      siteVisits.map(

        item =>
          item.propertyId

      )

      ),
    )









  return (

<div className="space-y-6 p-4 md:p-8">



{/* HEADER */}

<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">


<div>


<h1 className="text-2xl font-semibold md:text-3xl">
{deal.name}
</h1>


<div className="mt-3 flex flex-wrap gap-2">


<DealStageSelect
  deal={deal}
/>





<Badge variant="outline">

{
  property?.transactionType === "Rental"
    ? "Rental"
    : "Sale"
}

</Badge>





<Badge variant="outline">

{
  property?.propertyType ??
  "Property"
}

</Badge>





<Badge variant="outline">

{deal.probability}% probability

</Badge>


</div>


</div>





<div className="w-full md:w-auto">


<DealActions

deal={deal}

contact={contact}

/>


</div>


</div>








{/* QUICK INFO */}


<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">



<div className="rounded-2xl border p-4">

<h2 className="text-sm text-muted-foreground">
Buyer
</h2>


<p className="mt-2 font-medium">
{contact?.name ?? "Not assigned"}
</p>

</div>





<div className="rounded-2xl border p-4">

<h2 className="text-sm text-muted-foreground">
Property
</h2>


<p className="mt-2 font-medium">
{property?.name ?? "Not assigned"}
</p>


<p className="text-sm text-muted-foreground">
{property?.locality ?? ""}
</p>

</div>





<div className="rounded-2xl border p-4">

<h2 className="text-sm text-muted-foreground">
Advisor
</h2>


<p className="mt-2 font-medium">
{deal.advisor ?? "Not assigned"}
</p>

</div>





<div className="rounded-2xl border p-4">

<h2 className="text-sm text-muted-foreground">
Financials
</h2>


<div className="mt-3 space-y-3">


<div>

<p className="text-xs text-muted-foreground">
Property Value
</p>

<p className="font-semibold">
₹
{(
  deal.value?.propertyPrice ?? 0
).toLocaleString(
  "en-IN"
)}
</p>

</div>





<div>

<p className="text-xs text-muted-foreground">
Commission
</p>

<p className="font-semibold">

{
  deal.value?.commissionPercentage
    ? `${deal.value.commissionPercentage}%`
    : "Fixed"
}

</p>

</div>





<div>

<p className="text-xs text-muted-foreground">
Expected Commission
</p>

<p className="font-semibold text-primary">

₹
{(
  deal.value?.commissionAmount ?? 0
).toLocaleString(
  "en-IN"
)}

</p>

</div>





<div>

<p className="text-xs text-muted-foreground">
Commission Status
</p>

<p className="font-semibold">

{
  commissions.length
    ? commissions[0].status
    : "Not created"
}

</p>

</div>


</div>


</div>


</div>









{/* WORK AREA */}


<div className="grid gap-6 lg:grid-cols-2">



<DealTasks

deal={deal}

/>



<DealNotes

deal={deal}

/>



<DealHealth

deal={deal}

/>



<DealCommission

deal={deal}

commissions={commissions}

propertySources={propertySources}

role={user?.role}

paidDistributionAmount={
paidDistributionAmount
}

/>



</div>








{/* SHARED PROPERTIES */}


<section className="rounded-2xl border p-5 space-y-4">


<h2 className="text-xl font-semibold">
Shared Properties
</h2>

<SharedProperties

shares={sharedProperties}

properties={sharedPropertyDetails}

/>


</section>









{/* SITE VISITS */}


<SiteVisitsSection

visits={siteVisits}

properties={siteVisitProperties}

dealId={deal.id}

contactId={deal.contactId}

dealStage={deal.stage}

/>









{/* ACTIVITY */}


<section className="space-y-4">


<div className="flex items-center justify-between gap-3">

<h2 className="text-xl font-semibold">
Activity Timeline
</h2>

<Link
href={`/activities?entity=deal&id=${deal.id}`}
className="text-sm font-medium text-primary hover:underline"
>
View all
</Link>

</div>


<DealActivityTimeline

activities={activities}

/>


</section>


</div>

)}
