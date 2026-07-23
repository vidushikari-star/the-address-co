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
  SiteVisits,
} from "@/components/deals/site-visits"

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
    await getDealById(id)



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

    <div className="space-y-8 p-8">


      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">


        <div>

          <h1 className="text-3xl font-semibold">

            {deal.name}

          </h1>


          <div className="mt-3 flex gap-3">


            <DealStageSelect
              deal={deal}
            />


            <Badge variant="outline">

              {deal.probability}% probability

            </Badge>


          </div>


        </div>





        <div className="flex items-center gap-3">


          <DealActions
            deal={deal}
          />


        </div>


      </div>





      <div className="grid gap-6 md:grid-cols-4">


        <div className="rounded-2xl border p-6">

          <h2 className="font-semibold">
            Buyer
          </h2>


          <p className="mt-3">

            {contact?.name ?? "Not assigned"}

          </p>


        </div>





        <div className="rounded-2xl border p-6">

          <h2 className="font-semibold">
            Property
          </h2>


          <p className="mt-3">

            {property?.name ?? "Not assigned"}

          </p>


          <p className="text-sm text-muted-foreground">

            {property?.locality ?? ""}

          </p>


        </div>





        <div className="rounded-2xl border p-6">

          <h2 className="font-semibold">
            Advisor
          </h2>


          <p className="mt-3">

            {deal.advisor ?? "Not assigned"}

          </p>


        </div>





        <div className="rounded-2xl border p-6">

          <h2 className="font-semibold">
            Financials
          </h2>


          <p className="mt-3">

            Value:
            ₹
            {(
              deal.value?.propertyPrice ?? 0
            ).toLocaleString(
              "en-IN"
            )}

          </p>


        </div>


      </div>





      <div className="grid gap-6 md:grid-cols-2">


        <DealCommission

          commissions={
            commissions
          }

          role={
            user?.role
          }

        />



        <DealHealth
          deal={deal}
        />



        <DealNotes
          deal={deal}
        />



        <DealTasks
          deal={deal}
        />


      </div>





      <section className="rounded-2xl border p-6 space-y-4">


        <h2 className="text-xl font-semibold">

          Shared Properties

        </h2>



        <SharedProperties

          shares={
            sharedProperties
          }


          properties={
            sharedPropertyDetails
          }

        />


      </section>





      <section className="rounded-2xl border p-6 space-y-4">


        <h2 className="text-xl font-semibold">

          Site Visits

        </h2>



        <SiteVisits

          visits={
            siteVisits
          }


          properties={
            siteVisitProperties
          }

        />


      </section>





      <section className="space-y-4">


        <h2 className="text-xl font-semibold">

          Activity Timeline

        </h2>



        <DealActivityTimeline

          activities={
            activities
          }

        />


      </section>


    </div>

  )

}