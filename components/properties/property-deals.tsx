import Link from "next/link"

import type {
  Deal,
} from "@/types/deal"

import {
  formatCurrency,
  formatPropertyPrice,
} from "@/lib/utils/format-currency"



type Props = {

  deals: Deal[]

  transactionType: string

}





export function PropertyDeals({
  deals,
  transactionType,
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
          Buyer negotiations and expected commission.
        </p>

      </div>






      <div className="space-y-4">


        {
          deals.map(
            deal => {


              const commissionPercentage =
                deal.value?.commissionPercentage ?? 0



              const commissionAmount =
                deal.value?.commissionAmount ?? 0



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





                      {
                        transactionType === "Rental"
  ? false
  : true
                        ?

                        <p className="
                          text-sm
                          text-muted-foreground
                        ">

                          Commission:
                          {" "}
                          {commissionPercentage}%

                        </p>

                        :

                        <p className="
                          text-sm
                          text-muted-foreground
                        ">

                          Commission:
                          {" "}
                          Fixed

                        </p>

                      }







                      <p className="
                        font-semibold
                        text-primary
                      ">

                        {
                          formatCurrency(
                            commissionAmount
                          )
                        }

                      </p>


                    </div>


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