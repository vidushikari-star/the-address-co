"use client"

import {
  CalendarClock,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type {
  Contact,
} from "@/types/contact"



type Props = {
  contact: Contact
}



export function NextFollowUpCard({
  contact,
}: Props) {


  const followUp =
    contact.nextFollowUpAt



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
          gap-2
          text-base
        ">

          <CalendarClock
            className="
              h-4
              w-4
            "
          />

          Next Follow Up

        </CardTitle>

      </CardHeader>



      <CardContent className="
        px-4
        pb-5
      ">


        {
          followUp ? (

            <div className="
              text-sm
            ">

              <p className="
                font-medium
              ">

                {
                  new Date(
                    followUp
                  )
                  .toLocaleString(
                    "en-IN",
                    {
                      day:"numeric",
                      month:"short",
                      year:"numeric",
                      hour:"numeric",
                      minute:"2-digit",
                    }
                  )
                }

              </p>


              <p className="
                mt-1
                text-muted-foreground
              ">

                Follow up scheduled

              </p>


            </div>

          ) : (

            <p className="
              text-sm
              text-muted-foreground
            ">

              No follow-up scheduled

            </p>

          )

        }


      </CardContent>


    </Card>

  )

}