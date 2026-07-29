"use client"

import {
  useEffect,
  useState,
} from "react"

import Link from "next/link"

import type {
  Contact,
} from "@/types"

import type {
  Deal,
} from "@/types/deal"

import {
  getDealsByContactId,
} from "@/lib/repositories/deal-repository"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Badge,
} from "@/components/ui/badge"

import {
  BriefcaseBusiness,
} from "lucide-react"





type Props = {

  contact: Contact

}








export function RelationshipDeals({
  contact,
}:Props){



  const [
    deals,
    setDeals,
  ] =
  useState<Deal[]>([])



  const [
    loading,
    setLoading,
  ] =
  useState(true)







  useEffect(()=>{


    async function loadDeals(){


      try{


        const data =
          await getDealsByContactId(
            contact.id
          )


        setDeals(
          data
        )


      }
      finally{

        setLoading(false)

      }


    }



    loadDeals()


  },[
    contact.id
  ])








  return (

    <Card className="
      rounded-2xl
    ">



      <CardHeader className="
        px-4
        py-3
      ">


        <CardTitle className="
          flex
          items-center
          justify-between
          text-base
        ">


          <span className="
            flex
            items-center
            gap-2
          ">


            <BriefcaseBusiness className="
              h-4
              w-4
            "/>


            Deals


          </span>





          <Badge variant="secondary">

            {deals.length}

          </Badge>



        </CardTitle>


      </CardHeader>








      <CardContent className="
        space-y-4
        px-4
        pb-5
      ">





        {
          loading ? (

            <p className="
              text-sm
              text-muted-foreground
            ">

              Loading deals...

            </p>

          )

          :


          deals.length === 0 ? (

            <div className="
              rounded-xl
              border
              border-dashed
              p-5
              text-center
              text-sm
              text-muted-foreground
            ">

              No active deals.

            </div>

          )


          :

          (

            deals.map(
              deal => (

                <Link

                  key={
                    deal.id
                  }

                  href={`/deals/${deal.id}`}

                  className="
                    block
                  "

                >



                  <div className="
                    rounded-xl
                    border
                    p-4
                    transition
                    hover:border-primary/40
                    active:bg-muted/30
                  ">





                    <div className="
                      flex
                      items-start
                      justify-between
                      gap-3
                    ">



                      <div className="
                        min-w-0
                      ">


                        <p className="
                          truncate
                          font-semibold
                        ">

                          {deal.name}

                        </p>





                        <p className="
                          mt-1
                          text-xs
                          capitalize
                          text-muted-foreground
                        ">

                          {
                            deal.stage.replace(
                              /_/g,
                              " "
                            )
                          }

                        </p>



                      </div>






                      <Badge variant="outline">

                        {deal.probability}%


                      </Badge>



                    </div>









                    <div className="
                      mt-4
                      grid
                      grid-cols-2
                      gap-4
                    ">



                      <div>


                        <p className="
                          text-xs
                          text-muted-foreground
                        ">

                          Property Value

                        </p>



                        <p className="
                          mt-1
                          font-semibold
                        ">


                          ₹
                          {
                            (
                              deal.value?.propertyPrice
                              ??
                              0
                            )
                            .toLocaleString(
                              "en-IN"
                            )
                          }


                        </p>


                      </div>







                      <div>


                        <p className="
                          text-xs
                          text-muted-foreground
                        ">

                          Advisor

                        </p>



                        <p className="
                          mt-1
                          truncate
                          font-medium
                        ">

                          {
                            deal.advisor
                            ??
                            "Unassigned"
                          }


                        </p>


                      </div>




                    </div>






                  </div>



                </Link>

              )

            )

          )

        }



      </CardContent>


    </Card>

  )

}