"use client"

import Link from "next/link"

import {
  AlertTriangle,
  ArrowRight,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

import {
  Badge,
} from "@/components/ui/badge"



type DealRisk = {

  id:string

  name:string

  score:number

  status:string

  reasons:string[]

}



type Props = {

  deals: DealRisk[]

}






export function DealsAtRisk({
  deals,
}: Props) {





  const riskDeals =
    deals.slice(
      0,
      5
    )







  return (

    <DashboardCard>


      <DashboardCardHeader>


        <div>


          <p className="
            text-sm
            font-medium
            tracking-wide
            text-muted-foreground
          ">

            Sales Risk

          </p>



          <h3 className="
            mt-2
            text-xl
            font-semibold
            sm:text-2xl
          ">

            Deals At Risk

          </h3>


        </div>


      </DashboardCardHeader>






      <DashboardCardContent>


        {
          riskDeals.length === 0

          ?

          (

            <p className="
              text-sm
              text-muted-foreground
            ">

              No deals currently at risk.

            </p>

          )


          :

          (

            <div className="space-y-3">


              {
                riskDeals.map(
                  deal => (

                    <Link

                      key={
                        deal.id
                      }

                      href={
                        `/deals/${deal.id}`
                      }

                      className="block"

                    >


                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-3
                        rounded-xl
                        border
                        p-4
                        transition
                        hover:border-primary/30
                        hover:bg-muted/40
                      ">



                        <div className="
                          flex
                          min-w-0
                          gap-3
                        ">


                          <div className="
                            flex
                            h-9
                            w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            bg-muted
                          ">


                            <AlertTriangle className="
                              h-4
                              w-4
                            "/>


                          </div>






                          <div className="
                            min-w-0
                          ">


                            <p className="
                              truncate
                              font-medium
                            ">

                              {deal.name}

                            </p>





                            <div className="
                              mt-2
                              flex
                              flex-wrap
                              gap-2
                            ">


                              <Badge
                                variant="secondary"
                              >

                                {deal.status}

                              </Badge>



                              <Badge>

                                Score {deal.score}

                              </Badge>


                            </div>






                            {
                              deal.reasons.length > 0
                              &&

                              (

                                <p className="
                                  mt-2
                                  text-xs
                                  text-muted-foreground
                                ">

                                  {deal.reasons[0]}

                                </p>

                              )

                            }



                          </div>


                        </div>






                        <ArrowRight className="
                          h-4
                          w-4
                          shrink-0
                          text-muted-foreground
                        "/>



                      </div>


                    </Link>

                  )

                )

              }


            </div>

          )

        }


      </DashboardCardContent>


    </DashboardCard>

  )

}