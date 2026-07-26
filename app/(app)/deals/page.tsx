import {
  getDeals,
} from "@/lib/repositories/deal-repository"

import {
  DealFilters,
} from "@/components/deals/deal-filters"



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
  ){

    deals =
      deals.filter(
        deal => {

          const active =
            deal.stage !== "closed_won"
            &&
            deal.stage !== "closed_lost"


          const hot =
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

    <div className="space-y-6 p-8">


      <div className="flex items-center justify-between">


        <div>

          <h1 className="text-3xl font-semibold">
  {
    params.filter === "hot"
      ? "Hot Deals"
      : "Deals"
  }
</h1>


<p className="text-muted-foreground">
  {
    params.filter === "hot"
      ? "Priority opportunities requiring attention."
      : "Manage your active opportunities."
  }
</p>


        </div>




        <a

          href="/deals/new"

          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"

        >

          New Deal

        </a>


      </div>





      <DealFilters

        deals={
          deals
        }

      />


    </div>

  )

}