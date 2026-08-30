import Link from "next/link"

import { notFound } from "next/navigation"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"
import { loadAuthenticatedCrmData } from "@/lib/observability/crm-server-diagnostics"

import {
  formatExactPropertyPrice
} from "@/lib/utils/format-currency"

import {
  PropertyDocuments,
} from "@/components/properties/property-documents"

import {
  PropertyGallery,
} from "@/components/properties/property-gallery"

import {
  PropertyImageUpload,
} from "@/components/properties/property-image-upload"

import {
  SharePropertyButton,
} from "@/components/properties/share-property-button"

import {
  PublicShareSettings,
} from "@/components/properties/public-share-settings"

import {
  StatusBadge,
} from "@/components/shared/status-badge"

import {
  PropertyLabelBadges,
} from "@/components/properties/property-label-badges"

import {
  DeletePropertyButton,
} from "@/components/properties/delete-property-button"

import {
  ArchivePropertyButton,
} from "@/components/properties/archive-property-button"

import {
  PropertyDeals,
} from "@/components/properties/property-deals"

import {
  PropertyCreatedBanner,
} from "@/components/properties/property-created-banner"

import {
  PropertySourcesCard,
} from "@/components/properties/property-sources-card"

import {
  PropertyBuyerMatches,
} from "@/components/properties/property-buyer-matches"

import {
  getBuyerMatches,
} from "@/lib/services/buyer-matching"

import {
  hasMarketingAdminPermission,
} from "@/lib/auth/marketing"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
  canManagePropertyPublicSharing,
} from "@/lib/auth/permissions"

import {
  MarketingRepository,
} from "@/lib/marketing/repositories/marketing-repository"

import {
  MarketingStatusPill,
} from "@/components/marketing/status-pill"

import {
  PropertyActivityTimeline,
} from "@/components/properties/property-activity-timeline"

import {
  getActivityHistory,
} from "@/lib/repositories/activity-history-server-repository"





type Props = {

  params: Promise<{
    slug:string
  }>

  searchParams: Promise<{
    created?: string
  }>

}



function DetailRow({
  label,
  value,
}:{
  label:string
  value?:string | number | null
}){

  return (

    <div className="space-y-1">

      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">

        {label}

      </p>


      <p className="text-sm font-medium">

        {value || "-"}

      </p>


    </div>

  )

}





export default async function PropertyDetailPage({
  params,
  searchParams,
}:Props){

  const {
  slug
} = await params


const {
  created,
} = await searchParams

const crm = createAuthenticatedCrmReadRepository(await createServerSupabaseClient())



  const property =
    await loadAuthenticatedCrmData(
      { route: "/properties/[slug]", area: "property detail" },
      () => crm.getPropertyBySlug(slug),
    )



  if(!property){

    notFound()

  }

  const [
    canUseMarketing,
    currentUser,
  ] =
    await Promise.all([
      hasMarketingAdminPermission(),
      getServerUserProfile(),
    ])

  const canManagePublicSharing =
    canManagePropertyPublicSharing(
      currentUser
    )



  const [
  images,
  documents,
  deals,
  propertySources,
  contacts,
  marketingHistory,
  activityHistory,
] =
await loadAuthenticatedCrmData(
  { route: "/properties/[slug]", area: "property detail related data" },
  () => Promise.all([

  crm.getPropertyImages(
    property.id
  ),

  crm.getPropertyDocuments(
    property.id
  ),

  crm.getDealsByPropertyId(
    property.id
  ),

  crm.getPropertySources(
    property.id
  ),

  crm.getContacts(),

  canUseMarketing
    ? MarketingRepository.listContent({
        propertyId: property.id,
        limit: 8,
      })
    : Promise.resolve([]),

  getActivityHistory({
    entity: "property",
    entityId: property.id,
  }),

  ]),
)


const buyerMatches =
getBuyerMatches(
  property,
  contacts
)



const propertyValue =
  property.transactionType === "Rental"
    ? property.price.rent ?? 0
    : property.price.asking ?? 0





  return (

  <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6 lg:p-8">


  
      {
  created === "true" && (
    <PropertyCreatedBanner />
  )
}



      <section className="overflow-hidden rounded-3xl border bg-card">


        <div className="bg-gradient-to-r from-primary/5 via-background to-background p-6 sm:p-8">


          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">


            <div className="min-w-0 flex-1">


              <div className="mb-4 flex flex-wrap items-center gap-3">


                <StatusBadge
                  status={property.status}
                />


                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">

                  {property.propertyType}

                </span>

                <PropertyLabelBadges property={property} />


              </div>




              <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">

                {property.name}

              </h1>




              <p className="mt-3 text-4xl font-bold text-primary">

                {
                  formatExactPropertyPrice(
  property.transactionType === "Rental"
    ? property.price.rent
    : property.price.asking,
  property.transactionType
)
                }

              </p>





              <div className="mt-5 space-y-2 text-muted-foreground">


  <p className="font-medium">

    {property.developer}

  </p>


  <p>

    {property.location}

  </p>


  {
    property.googleMapLink && (

      <a

        href={
          property.googleMapLink
        }

        target="_blank"

        rel="noopener noreferrer"

        className="
          inline-flex
          items-center
          gap-1
          text-sm
          font-medium
          text-primary
          underline
        "

      >

        📍 Open Google Maps

      </a>

    )
  }


</div>


            </div>





            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">


              <SharePropertyButton
                property={property}
              />

              <Link
                href={`/properties/${property.slug}/edit`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >

                Edit Property

              </Link>

              {
                canUseMarketing && (
                  <Link
                    href={`/marketing/create?property=${property.id}`}
                    className="inline-flex h-11 items-center justify-center rounded-xl border bg-background px-5 text-sm font-medium transition hover:bg-muted"
                  >
                    Create Marketing Content
                  </Link>
                )
              }

              <ArchivePropertyButton
  propertyId={
    property.id
  }
/>




              <DeletePropertyButton
                propertyId={
                  property.id
                }
              />

            </div>


          </div>


        </div>


      </section>





      <section className="rounded-3xl border bg-card">


        <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">


          <div>


            <h2 className="text-xl font-semibold">

              Property Images

            </h2>


            <p className="mt-1 text-sm text-muted-foreground">

              Upload, manage and choose the cover image.

            </p>


          </div>



          <PropertyImageUpload
            propertyId={property.id}
          />


        </div>



        <div className="p-6">


          <section id="gallery">

  <PropertyGallery
    propertyId={property.id}
    images={images}
  />

</section>


        </div>


      </section>

      <section id="documents">

  <PropertyDocuments
    documents={documents}
    propertyId={property.id}
  />

</section>

      <PublicShareSettings
        property={property}
        canManage={canManagePublicSharing}
        images={images.map(image => ({
          id: image.id,
          label: image.mediaType === "video" ? "Property video" : "Property image",
          publicShareAllowed: image.publicShareAllowed,
        }))}
        documents={documents
          .filter(document => ["brochure", "floor_plan"].includes(document.category))
          .map(document => ({
            id: document.id,
            label: document.name,
            category: document.category,
            publicShareAllowed: document.publicShareAllowed ?? false,
          }))}
      />



<PropertySourcesCard

  sources={
    propertySources
  }

  contacts={
    contacts
  }

  propertyId={
    property.id
  }

  propertyValue={
    propertyValue
  }

  transactionType={
    property.transactionType
  }

/>

<PropertyBuyerMatches
  matches={buyerMatches}
  propertyId={property.id}
/>

      <section className="rounded-3xl border bg-card p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Activity Timeline</h2>
            <p className="mt-1 text-sm text-muted-foreground">Recent activity for this property.</p>
          </div>
          <Link href={`/activities?entity=property&id=${property.id}`} className="text-sm font-medium text-primary hover:underline">View all</Link>
        </div>
        <div className="mt-5">
          <PropertyActivityTimeline activities={activityHistory.items.slice(0, 5)} />
        </div>
      </section>

      <PropertyDeals
  deals={deals}
  propertySources={propertySources}
  transactionType={
    property.transactionType
  }
/>


      {
        canUseMarketing && (
          <section className="rounded-3xl border bg-card p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Marketing History</h2>
                <p className="mt-1 text-sm text-muted-foreground">Creative drafts, approvals and publications generated from this property.</p>
              </div>
              <Link href={`/marketing/content?property=${property.id}`} className="text-sm font-medium text-primary hover:underline">Open content library</Link>
            </div>
            {
              marketingHistory.length ? (
                <div className="mt-5 divide-y rounded-2xl border">
                  {marketingHistory.map(item => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div><p className="font-medium">{item.title || item.contentType.replaceAll("_", " ")}</p><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(item.createdAt))}</p></div>
                      <MarketingStatusPill status={item.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">No marketing content has been created for this property.</p>
              )
            }
          </section>
        )
      }





      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">


        <section className="rounded-3xl border bg-card p-6">


          <h2 className="text-xl font-semibold">

            About the Property

          </h2>



          <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">

            {property.description ||
              "No description added."}

          </p>


        </section>





        <section className="rounded-3xl border bg-card p-6">


          <h2 className="text-xl font-semibold">

            Financials

          </h2>



          <div className="mt-6 space-y-6">


            <DetailRow

              label={
                property.transactionType === "Rental"
                  ? "Monthly Rent"
                  : "Asking Price"
              }

              value={
                formatExactPropertyPrice(
  property.transactionType === "Rental"
    ? property.price.rent
    : property.price.asking,
  property.transactionType
)
              }

            />



            <DetailRow

              label="Advisor"

              value={
                property.advisor
              }

            />

            


          </div>


        </section>


      </div>





      {/* Remaining sections stay unchanged */}

    </div>

  )

}
