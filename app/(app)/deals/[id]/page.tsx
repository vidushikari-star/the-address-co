import { notFound } from "next/navigation"

import {
  getDealById,
} from "@/lib/repositories/deal-repository"

import {
  getPropertyById,
  getPropertiesByIds,
} from "@/lib/repositories/property-repository"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  getActivitiesByDealId,
} from "@/lib/repositories/activity-repository"

import {
  getPropertySharesByDealId,
} from "@/lib/repositories/property-share-repository"

import {
  getSiteVisitsByDealId,
} from "@/lib/repositories/site-visit-repository"

import {
  getCommissionsByDealId,
} from "@/lib/repositories/commission-server-repository"

import {
  getPaidDistributionAmount,
} from "@/lib/repositories/commission-distribution-repository"

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





  const deal =
    await getDealById(
      id
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

  ] =

  await Promise.all([


    ContactsRepository.getById(
      deal.contactId
    ),


    getPropertyById(
      deal.propertyId
    ),


    getActivitiesByDealId(
      deal.id
    ),


    getPropertySharesByDealId(
      deal.id
    ),


    getSiteVisitsByDealId(
      deal.id
    ),


    getCommissionsByDealId(
      deal.id
    ),


  ])








  const paidDistributionAmount =

    await getPaidDistributionAmount(

      commissions.map(

        commission =>
          commission.id

      )

    )









  const sharedPropertyDetails =

    await getPropertiesByIds(

      sharedProperties.map(

        item =>
          item.propertyId

      )

    )









  const siteVisitProperties =

    await getPropertiesByIds(

      siteVisits.map(

        item =>
          item.propertyId

      )

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

<div className="
rounded-xl
bg-muted/40
p-4
space-y-3
">

<div className="flex justify-between">

<span className="text-sm text-muted-foreground">
Property Value
</span>

<span className="font-semibold">

₹
{deal.value.propertyPrice.toLocaleString("en-IN")}

</span>

</div>


<div className="flex justify-between">

<span className="text-sm text-muted-foreground">
Commission %
</span>

<span className="font-semibold">

{deal.value.commissionPercentage || 0}%

</span>

</div>


<div className="flex justify-between">

<span className="text-sm text-muted-foreground">
Expected Commission
</span>

<span className="font-semibold text-primary">

₹
{deal.value.commissionAmount.toLocaleString("en-IN")}

</span>

</div>


</div>

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


<h2 className="text-xl font-semibold">
Activity Timeline
</h2>


<DealActivityTimeline

activities={activities}

/>


</section>


</div>

)}