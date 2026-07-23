import {
  getDeals,
} from "@/lib/repositories/deal-repository"

import {
  DealFilters,
} from "@/components/deals/deal-filters"



export default async function DealsPage() {


  const deals =
    await getDeals()



  return (

    <div className="space-y-6 p-8">


      <div className="flex items-center justify-between">


        <div>

          <h1 className="text-3xl font-semibold">
            Deals
          </h1>


          <p className="text-muted-foreground">
            Manage your active opportunities.
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