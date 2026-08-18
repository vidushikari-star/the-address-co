"use client"

import type {
  Contact,
} from "@/types"

import {
  BadgeIndianRupee,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"





type RelationshipSnapshotProps = {

  contact: Contact

  showRequirements?: boolean

  showCrm?: boolean

}








export function RelationshipSnapshot({
  contact,
  showRequirements = true,
  showCrm = true,
}:RelationshipSnapshotProps){



  const locations =
    contact.locations ?? []

  const requirementDetails = [
    contact.bathrooms !== undefined ? ["Bathrooms", String(contact.bathrooms)] : null,
    contact.purpose ? ["Purpose", contact.purpose.replaceAll("_", " ")] : null,
    contact.financing ? ["Financing", contact.financing.replaceAll("_", " ")] : null,
    contact.resident ? ["Residence", contact.resident.replaceAll("_", " ")] : null,
    contact.minArea || contact.maxArea ? ["Area", `${contact.minArea?.toLocaleString("en-IN") ?? "—"} – ${contact.maxArea?.toLocaleString("en-IN") ?? "—"}`] : null,
    contact.plotSize ? ["Plot size", contact.plotSize.toLocaleString("en-IN")] : null,
    contact.mustHave?.length ? ["Must have", contact.mustHave.join(", ")] : null,
    contact.niceToHave?.length ? ["Nice to have", contact.niceToHave.join(", ")] : null,
  ].filter((detail): detail is [string, string] => Boolean(detail))

  const relationshipDetails = [
    contact.spouseName ? ["Spouse", contact.spouseName] : null,
    contact.coBuyer ? ["Co-buyer", contact.coBuyer] : null,
    contact.referralSource ? ["Referral", contact.referralSource] : null,
  ].filter((detail): detail is [string, string] => Boolean(detail))







  return (

    <div className="
      space-y-4
    ">






      {/* CONTACT */}


      <Card className="
        rounded-2xl
      ">


        <CardHeader className="
          px-4
          py-3
        ">

          <CardTitle className="
            text-base
          ">

            Contact

          </CardTitle>


        </CardHeader>





        <CardContent className="
          space-y-3
          px-4
          pb-5
        ">





          <div className="
            flex
            items-center
            gap-3
            text-sm
          ">

            <Phone className="
              h-4
              w-4
              shrink-0
              text-muted-foreground
            "/>


            <span className="
              truncate
            ">

              {
                contact.phone ||
                "Not provided"
              }

            </span>


          </div>








          {
            contact.email && (

              <div className="
                flex
                items-center
                gap-3
                text-sm
              ">


                <Mail className="
                  h-4
                  w-4
                  shrink-0
                  text-muted-foreground
                "/>


                <span className="
                  truncate
                ">

                  {contact.email}

                </span>


              </div>

            )
          }








          <div className="
  flex
  items-center
  gap-3
  text-sm
">


  <User className="
    h-4
    w-4
    shrink-0
    text-muted-foreground
  "/>


  <div className="
    flex
    flex-wrap
    gap-2
  ">

    {
      contact.relationshipTypes?.length ? (

        contact.relationshipTypes.map(
          type => (

            <Badge
              key={type}
              variant="secondary"
            >
              {type}
            </Badge>

          )
        )

      ) : (

        <Badge variant="secondary">
          Buyer
        </Badge>

      )
    }

  </div>


</div>







          {
            contact.city && (

              <div className="
                flex
                items-center
                gap-3
                text-sm
              ">


                <MapPin className="
                  h-4
                  w-4
                  shrink-0
                  text-muted-foreground
                "/>


                {contact.city}


              </div>

            )
          }

          {
            contact.country && (

              <InfoRow
                label="Country"
                value={contact.country}
              />

            )
          }

          {
            contact.whatsapp &&
            contact.whatsapp !== contact.phone && (

              <InfoRow
                label="WhatsApp"
                value={contact.whatsapp}
              />

            )
          }

          {
            relationshipDetails.map(([label, value]) => (

              <InfoRow
                key={label}
                label={label}
                value={value}
              />

            ))
          }




        </CardContent>


      </Card>









      {/* REQUIREMENTS */}


      {
        showRequirements && (

      <Card className="
        rounded-2xl
      ">


        <CardHeader className="
          px-4
          py-3
        ">


          <CardTitle className="
            text-base
          ">

            Requirements

          </CardTitle>


        </CardHeader>







        <CardContent className="
          space-y-5
          px-4
          pb-5
        ">






          {
            (
              contact.budgetMin
              ||
              contact.budgetMax
            )
            && (

              <div>


                <p className="
                  flex
                  items-center
                  gap-2
                  text-xs
                  text-muted-foreground
                ">

                  <BadgeIndianRupee className="
                    h-4
                    w-4
                  "/>


                  Budget


                </p>




                <p className="
                  mt-2
                  text-lg
                  font-semibold
                ">


                  ₹
                  {
                    contact.budgetMin
                    ?.toLocaleString(
                      "en-IN"
                    )
                    ??
                    "—"
                  }


                  {" - "}


                  ₹
                  {
                    contact.budgetMax
                    ?.toLocaleString(
                      "en-IN"
                    )
                    ??
                    "—"
                  }


                </p>


              </div>

            )

          }









          <div className="
            grid
            grid-cols-2
            gap-4
          ">



            {
              contact.propertyType && (

                <div>


                  <p className="
                    text-xs
                    text-muted-foreground
                  ">

                    Property

                  </p>



                  <Badge

                    className="
                      mt-2
                    "

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


                  <p className="
                    text-xs
                    text-muted-foreground
                  ">

                    Size

                  </p>



                  <Badge

                    className="
                      mt-2
                    "

                  >

                    {contact.bedrooms} BHK

                  </Badge>


                </div>

              )
            }


          </div>









          {
            locations.length > 0 && (

              <div>


                <p className="
                  mb-2
                  text-xs
                  text-muted-foreground
                ">

                  Preferred Locations

                </p>



                <div className="
                  flex
                  flex-wrap
                  gap-2
                ">


                  {
                    locations.map(
                      location => (

                        <Badge

                          key={
                            location
                          }

                          variant="outline"

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

          {
            requirementDetails.length > 0 && (

              <div className="space-y-3 border-t pt-4">

                {
                  requirementDetails.map(([label, value]) => (

                    <InfoRow
                      key={label}
                      label={label}
                      value={value}
                    />

                  ))
                }

              </div>

            )
          }



        </CardContent>


      </Card>

        )
      }









      {/* CRM */}


      {
        showCrm && (

      <Card className="
        rounded-2xl
      ">


        <CardHeader className="
          px-4
          py-3
        ">


          <CardTitle className="
            text-base
          ">

            CRM

          </CardTitle>


        </CardHeader>







        <CardContent className="
          space-y-4
          px-4
          pb-5
        ">



          <InfoRow

            label="Advisor"

            value={
              contact.assignedAdvisor ??
              "Unassigned"
            }

          />




          <InfoRow

            label="Source"

            value={
              contact.leadSource ??
              "Unknown"
            }

          />




          <InfoRow

            label="Timeline"

            value={
              contact.timeline ??
              "Not specified"
            }

          />



        </CardContent>


      </Card>

        )
      }



    </div>

  )

}







function InfoRow({
  label,
  value,
}:{
  label:string
  value:string
}){

  return (

    <div className="
      flex
      items-start
      justify-between
      gap-4
      text-sm
    ">


      <span className="
        text-muted-foreground
      ">

        {label}

      </span>



      <span className="
        max-w-[60%]
        truncate
        text-right
        font-medium
      ">

        {value}

      </span>


    </div>

  )

}
