import Link from "next/link"

import type {
  Deal,
} from "@/types/deal"

import {
  formatPropertyPrice,
} from "@/lib/utils/format-currency"

import type {
  PropertySource,
} from "@/lib/repositories/property-contact-repository"

import {
  DealCommissionBreakdown,
} from "@/components/deals/deal-commission-breakdown"



type Props = {

  deals: Deal[]

  transactionType: string

  propertySources: PropertySource[]

}





export function PropertyDeals({
  deals,
  transactionType,
  propertySources,
}:Props){


  if(!deals.length){

    return null

  }





  return (

    <section
      className="
        rounded-3xl
        border
        bg-card
        p-6
        space-y-5
      "
    >


      <div>

        <h2 className="text-xl font-semibold">
          Deals & Commission
        </h2>


        <p className="text-sm text-muted-foreground">
          Buyer and seller commission expectations.
        </p>

      </div>






      <div className="space-y-4">


        {
          deals.map(
            deal => {


              return (

                <Link

                  key={
                    deal.id
                  }

                  href={`/deals/${deal.id}`}

                  className="
                    block
                    rounded-2xl
                    border
                    p-4
                    hover:border-primary
                  "

                >


                  <div
                    className="
                      flex
                      justify-between
                      gap-4
                    "
                  >


                    <div>


                      <p className="font-semibold">

                        {deal.name}

                      </p>



                      <p className="
                        text-sm
                        text-muted-foreground
                      ">

                        Stage:
                        {" "}
                        {deal.stage.replaceAll(
                          "_",
                          " "
                        )}

                      </p>


                    </div>







                    <div className="text-right">


                      <p className="font-semibold">

                        {
                          formatPropertyPrice(
  deal.value?.propertyPrice,
  transactionType
)
                        }

                      </p>


                    </div>


                  </div>



                  <div className="mt-4 border-t pt-4">

                    <DealCommissionBreakdown
                      deal={deal}
                      propertySources={propertySources}
                    />

                  </div>


                </Link>

              )

            }
          )
        }


      </div>


    </section>

  )

}
