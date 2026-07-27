"use client"

import type { Contact } from "@/types"

import {
  BadgeIndianRupee,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



type RelationshipSnapshotProps = {
  contact: Contact
}





export function RelationshipSnapshot({
  contact,
}: RelationshipSnapshotProps) {


  const locations =
    contact.locations ?? []



  return (

    <div className="space-y-4">





      {/* CONTACT */}

      <Card>


        <CardHeader className="px-4 py-3">

          <CardTitle className="text-base">
            Contact
          </CardTitle>

        </CardHeader>



        <CardContent className="space-y-3 px-4 pb-4">


          <div className="flex min-w-0 items-center gap-3 text-sm">

            <Phone className="h-4 w-4 shrink-0 text-muted-foreground"/>

            <span className="truncate">

              {contact.phone || "Not provided"}

            </span>

          </div>




          {
            contact.email && (

              <div className="flex min-w-0 items-center gap-3 text-sm">

                <Mail className="h-4 w-4 shrink-0 text-muted-foreground"/>

                <span className="truncate">

                  {contact.email}

                </span>

              </div>

            )
          }





          <div className="flex items-center gap-3 text-sm">

            <User className="h-4 w-4 shrink-0 text-muted-foreground"/>

            Buyer

          </div>





          {
            contact.city && (

              <div className="flex items-center gap-3 text-sm">

                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground"/>

                {contact.city}

              </div>

            )
          }


        </CardContent>


      </Card>








      {/* REQUIREMENTS */}

      <Card>


        <CardHeader className="px-4 py-3">

          <CardTitle className="text-base">
            Requirements
          </CardTitle>

        </CardHeader>




        <CardContent className="
          grid
          grid-cols-1
          gap-4
          px-4
          pb-4
          sm:grid-cols-2
        ">





          {
            (contact.budgetMin ||
            contact.budgetMax) && (

              <div className="sm:col-span-2">

                <p className="flex items-center gap-2 text-xs text-muted-foreground">

                  <BadgeIndianRupee className="h-3.5 w-3.5"/>

                  Budget

                </p>


                <p className="mt-1 text-sm font-medium">

                  ₹
                  {
                    contact.budgetMin?.toLocaleString()
                    ??
                    "—"
                  }

                  {" - "}

                  ₹
                  {
                    contact.budgetMax?.toLocaleString()
                    ??
                    "—"
                  }

                </p>


              </div>

            )
          }





          {
            contact.propertyType && (

              <div>

                <p className="text-xs text-muted-foreground">
                  Type
                </p>

                <Badge
                  className="mt-1"
                  variant="secondary"
                >

                  {contact.propertyType}

                </Badge>

              </div>

            )
          }






          {
            contact.bedrooms && (

              <div>

                <p className="text-xs text-muted-foreground">
                  Size
                </p>


                <Badge className="mt-1">

                  {contact.bedrooms} BHK

                </Badge>

              </div>

            )
          }





          {
            locations.length > 0 && (

              <div className="sm:col-span-2">


                <p className="mb-2 text-xs text-muted-foreground">

                  Preferred Locations

                </p>



                <div className="flex flex-wrap gap-2">

                  {
                    locations.map(
                      location => (

                        <Badge
                          key={location}
                          variant="outline"
                          className="break-words"
                        >

                          {location}

                        </Badge>

                      )
                    )
                  }

                </div>


              </div>

            )
          }



        </CardContent>


      </Card>









      {/* CRM */}

      <Card>


        <CardHeader className="px-4 py-3">

          <CardTitle className="text-base">
            CRM
          </CardTitle>

        </CardHeader>




        <CardContent className="space-y-3 px-4 pb-4">



          <div className="flex items-start justify-between gap-4 text-sm">

            <span className="shrink-0 text-muted-foreground">
              Advisor
            </span>

            <span className="truncate text-right font-medium">
              {contact.assignedAdvisor ?? "Unassigned"}
            </span>

          </div>





          <div className="flex items-start justify-between gap-4 text-sm">

            <span className="shrink-0 text-muted-foreground">
              Source
            </span>

            <span className="truncate text-right font-medium">
              {contact.leadSource ?? "Unknown"}
            </span>

          </div>





          <div className="flex items-start justify-between gap-4 text-sm">

            <span className="flex shrink-0 items-center gap-1 text-muted-foreground">

              <CalendarClock className="h-4 w-4"/>

              Timeline

            </span>


            <span className="truncate text-right font-medium">

              {contact.timeline ?? "Not specified"}

            </span>


          </div>



        </CardContent>


      </Card>


    </div>

  )

}