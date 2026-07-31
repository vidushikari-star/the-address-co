"use client"

import Link from "next/link"

import type {
  Deal,
} from "@/types/deal"

import {
  formatCurrency,
} from "@/lib/utils/format-currency"

import {
  Calendar,
  CheckSquare,
  FileText,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"


type Props = {
  deal: Deal
}





function formatStage(
  stage:string
){

  return stage
    .replace(
      /_/g,
      " "
    )

}








export function DealCard({
  deal,
}:Props){


  return (

    <Link

      href={`/deals/${deal.id}`}

      className="block"

    >


      <div className="
        rounded-2xl
        border
        bg-card
        p-4
        space-y-4
        transition
        hover:border-primary
        hover:shadow-sm
      ">



        <div className="
          flex
          items-start
          justify-between
          gap-3
        ">



          <div className="min-w-0">


            <h3 className="
              truncate
              font-semibold
            ">

              {
                deal.name ||
                "Untitled Deal"
              }

            </h3>



            <p className="
              mt-1
              text-xs
              text-muted-foreground
            ">

              Advisor:
              {" "}
              {
                deal.advisor ||
                "Unassigned"
              }

            </p>


          </div>





          <ArrowRight

            className="
              h-4
              w-4
              shrink-0
              text-muted-foreground
            "

          />


        </div>








        <div className="
          flex
          flex-wrap
          gap-2
        ">


          <Badge>

            {
              formatStage(
                deal.stage
              )
            }

          </Badge>





          {
            deal.priority === "high" && (

              <Badge variant="destructive">

                High Priority

              </Badge>

            )
          }


        </div>








        <div className="
          rounded-xl
          bg-muted/40
          p-3
        ">


          <p className="
            text-xs
            text-muted-foreground
          ">

            Deal Value

          </p>



          <p className="
            mt-1
            text-xl
            font-semibold
          ">

            {
              formatCurrency(
                deal.value.propertyPrice
              )
            }

          </p>


        </div>








        <div className="
          grid
          grid-cols-2
          gap-3
        ">



          <div className="
            rounded-xl
            border
            p-3
          ">


            <div className="
              flex
              items-center
              gap-2
              text-xs
              text-muted-foreground
            ">

              <TrendingUp className="h-4 w-4"/>

              Probability

            </div>



            <p className="
              mt-2
              font-semibold
            ">

              {deal.probability}%

            </p>


          </div>








          <div className="
            rounded-xl
            border
            p-3
          ">


            <div className="
              flex
              items-center
              gap-2
              text-xs
              text-muted-foreground
            ">

              <Calendar className="h-4 w-4"/>

              Close

            </div>



            <p className="
              mt-2
              text-sm
              font-medium
            ">


              {
                deal.expectedCloseDate
                ?
                new Date(
                  deal.expectedCloseDate
                )
                .toLocaleDateString(
                  "en-IN",
                  {
                    day:"2-digit",
                    month:"short",
                  }
                )
                :
                "-"
              }


            </p>


          </div>



        </div>








        <div className="
          flex
          items-center
          justify-between
          border-t
          pt-3
          text-xs
          text-muted-foreground
        ">


          <span className="
            flex
            items-center
            gap-1
          ">

            <CheckSquare className="h-4 w-4"/>

            {deal.tasks?.length ?? 0}

          </span>





          <span className="
            flex
            items-center
            gap-1
          ">

            <FileText className="h-4 w-4"/>

            {deal.notes?.length ?? 0}

          </span>


        </div>




      </div>


    </Link>

  )

}