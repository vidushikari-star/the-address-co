"use client"

import {
  useEffect,
  useState,
} from "react"

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

      <CardHeader>

        <CardTitle className="flex items-center gap-2">

          <BriefcaseBusiness className="h-4 w-4"/>

          Deals

        </CardTitle>

      </CardHeader>




      <CardContent className="space-y-4">


        {
          deals.length === 0

          ?

          (

            <p className="text-sm text-muted-foreground">
              No active deals.
            </p>

          )

          :

          (

            deals.map(
              deal => (

                <div
                  key={deal.id}
                  className="rounded-lg border p-4"
                >

                  <p className="font-medium">
                    {deal.name}
                  </p>


                  <p className="text-sm text-muted-foreground mt-1">

                    Stage:
                    {" "}
                    {deal.stage}

                  </p>



                  <p className="text-sm text-muted-foreground">

                    Advisor:
                    {" "}
                    {deal.advisor || "Not assigned"}

                  </p>



                  <p className="text-sm text-muted-foreground">

                    Value:
                    {" "}
                    ₹
                    {(
                      deal.value?.propertyPrice ?? 0
                    ).toLocaleString(
                      "en-IN"
                    )}

                  </p>


                </div>

              )
            )

          )

        }


      </CardContent>

    </Card>

  )

}