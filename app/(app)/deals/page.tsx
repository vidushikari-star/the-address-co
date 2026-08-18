import {
  getDeals,
} from "@/lib/repositories/deal-repository"

import {
  DealFilters,
} from "@/components/deals/deal-filters"

import Link from "next/link"



export const dynamic = "force-dynamic"





export default async function DealsPage({
  searchParams,
}:{
  searchParams: Promise<{
    filter?:string
  }>
}) {


  const params =
    await searchParams



  let deals =
    await getDeals()





  if(
    params.filter === "hot"
    || params.filter === "active"
  ){

    deals =
      deals.filter(
        deal => {


          const active =
            deal.stage !== "closed_won"
            &&
            deal.stage !== "closed_lost"



          const hot =
            params.filter === "active"
            ||
            deal.priority === "high"
            ||
            deal.stage === "negotiation"
            ||
            deal.stage === "documentation"
            ||
            deal.stage === "site_visit"



          return active && hot

        }
      )

  }







  return (

    <div className="
      space-y-6
      p-4
      md:p-8
    ">


      <div className="
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-start
        sm:justify-between
      ">



        <div>


          <h1 className="
            text-2xl
            font-semibold
            md:text-3xl
          ">

            {
              params.filter === "hot"
              ? "Hot Deals"
              : "Deals"
            }


          </h1>



          <p className="
            text-sm
            text-muted-foreground
            md:text-base
          ">

            {
              params.filter === "hot"
              ? "Priority opportunities requiring attention."
              : "Manage your active opportunities."
            }


          </p>


        </div>






        <Link
  href="/deals/new"
  className="
    flex
    w-full
    items-center
    justify-center
    rounded-xl
    bg-primary
    px-4
    py-3
    text-sm
    text-primary-foreground
    sm:w-auto
  "
>
  New Deal
</Link>



      </div>







      <DealFilters

        deals={
          deals
        }

      />



    </div>

  )

}
