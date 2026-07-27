"use client"

import {
  useEffect,
  useState,
} from "react"

import Link from "next/link"

import type { Contact } from "@/types"
import type { Deal } from "@/types/deal"

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
}: Props) {


  const [
    deals,
    setDeals,
  ] =
  useState<Deal[]>([])





  useEffect(() => {


    async function loadDeals(){


      try {

        const data =
          await getDealsByContactId(
            contact.id
          )

        setDeals(data)


      } catch(error){

        console.error(
          "Failed loading deals",
          error
        )

      }


    }



    loadDeals()


  },[contact.id])







  return (

    <Card>


      <CardHeader className="px-4 py-3">


        <CardTitle className="flex items-center justify-between text-base">


          <span className="flex items-center gap-2">

            <BriefcaseBusiness className="h-4 w-4"/>

            Deals

          </span>



          <Badge variant="secondary">

            {deals.length}

          </Badge>


        </CardTitle>


      </CardHeader>






      <CardContent className="space-y-3 px-4 pb-4">



        {
          deals.length === 0 ? (

            <p className="text-sm text-muted-foreground">

              No active deals.

            </p>

          ) : (


            deals.map(

              deal => (

                <Link

                  key={deal.id}

                  href={`/deals/${deal.id}`}

                  className="block"

                >


                  <div

                    className="
                      rounded-xl
                      border
                      p-3
                      transition
                      hover:border-primary/30
                    "

                  >



                    <div className="flex items-start justify-between gap-3">


                      <div className="min-w-0">


                        <p className="truncate font-medium">

                          {deal.name}

                        </p>



                        <p className="mt-1 text-xs text-muted-foreground capitalize">

                          {deal.stage.replace(
                            /_/g,
                            " "
                          )}

                        </p>


                      </div>





                      <Badge
                        variant="outline"
                      >

                        {
                          deal.probability
                        }%

                      </Badge>


                    </div>






                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">


                      <div>

                        <p className="text-xs text-muted-foreground">
                          Value
                        </p>


                        <p className="font-semibold">

                          ₹
                          {
                            (
                              deal.value?.propertyPrice
                              ??
                              0
                            ).toLocaleString(
                              "en-IN"
                            )
                          }

                        </p>


                      </div>






                      <div>

                        <p className="text-xs text-muted-foreground">
                          Advisor
                        </p>


                        <p className="truncate font-medium">

                          {
                            deal.advisor ??
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