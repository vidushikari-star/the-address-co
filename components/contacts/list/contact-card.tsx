"use client"

import { useRouter } from "next/navigation"

import {
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react"

import { Avatar } from "@/components/shared/avatar"
import { StatusBadge } from "@/components/shared/status-badge"
import { WhatsAppButton } from "@/components/communications/whatsapp-button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getLeadPriority } from "@/lib/utils/lead-score"
import type { Contact } from "@/types/contact"


type ContactCardProps = {
  contact: Contact
  onClick?: (contact: Contact) => void
  className?: string
}


export function ContactCard({
  contact,
  onClick,
  className,
}: ContactCardProps) {


  const router =
    useRouter()



  function handleClick() {

    onClick?.(contact)

    router.push(
      `/contacts/${contact.id}`
    )

  }



  const phone = (
    contact.whatsapp ??
    contact.phone ??
    ""
  ).replace(/\D/g, "")





  function formatBudget(
    value?: number
  ){

    if(!value){
      return null
    }


    if(value >= 10000000){

      return `${(
        value / 10000000
      ).toFixed(1)} Cr`

    }


    if(value >= 100000){

      return `${(
        value / 100000
      ).toFixed(0)} L`

    }


    return value.toString()

  }





  function getFollowUpStatus(
    lastActivityAt?: string
  ){

    if(!lastActivityAt){

      return {
        label:"Needs Contact",
        variant:"new",
      }

    }


    const lastActivity =
      new Date(lastActivityAt)


    const daysSinceActivity =
      Math.floor(
        (
          Date.now() -
          lastActivity.getTime()
        )
        /
        (
          1000 *
          60 *
          60 *
          24
        )
      )


    if(daysSinceActivity >= 7){

      return {
        label:"Follow Up Due",
        variant:"due",
      }

    }


    return null

  }





  const budgetLabel =
    contact.budgetMin || contact.budgetMax
      ? `${formatBudget(contact.budgetMin)} - ${formatBudget(contact.budgetMax)}`
      : null





  const leadPriority =
    getLeadPriority(
      contact
    )





  const followUpStatus =
    getFollowUpStatus(
      contact.lastActivityAt
    )





  return (

    <div
      className={cn(
        `
        rounded-2xl
        border
        bg-card
        p-4
        transition
        active:bg-muted/40
        hover:border-primary/20
        `,
        className
      )}
    >


      <button
        type="button"
        onClick={handleClick}
        className="
          flex
          w-full
          items-center
          gap-3
          text-left
        "
      >

        <Avatar
          name={contact.name || "Unknown"}
          size="md"
        />



        <div className="min-w-0 flex-1">


          <div className="
            flex
            flex-wrap
            items-center
            gap-2
          ">

            <h3 className="
              truncate
              font-semibold
            ">

              {contact.name || "Unnamed"}

            </h3>


            <StatusBadge
              status={contact.stage}
            />


          </div>





          <div className="
            mt-2
            flex
            flex-wrap
            gap-2
          ">



            <Badge
              variant="secondary"
            >

              {leadPriority.emoji}
              {" "}
              {leadPriority.label}

            </Badge>





            {
              followUpStatus && (

                <Badge
                  variant={
                    followUpStatus.variant === "due"
                      ? "destructive"
                      : "secondary"
                  }
                >

                  {followUpStatus.label}

                </Badge>

              )
            }





            {
              contact.intent && (

                <Badge
                  variant="secondary"
                >

                  {
                    contact.intent === "sale"
                      ? "Sale"
                      : contact.intent === "rental"
                      ? "Rental"
                      : "Sale + Rental"
                  }

                </Badge>

              )
            }





            {
              contact.propertyType && (

                <Badge
                  variant="outline"
                >

                  {contact.propertyType}

                </Badge>

              )
            }





            {
              budgetLabel && (

                <Badge
                  variant="outline"
                >

                  ₹ {budgetLabel}

                </Badge>

              )
            }


          </div>





          <div className="
            mt-2
            space-y-1
            text-sm
            text-muted-foreground
          ">


            {contact.phone && (

              <div className="
                flex
                items-center
                gap-2
              ">

                <Phone className="
                  h-3.5
                  w-3.5
                " />

                {contact.phone}

              </div>

            )}




            {contact.email && (

              <div className="
                flex
                items-center
                gap-2
              ">

                <Mail className="
                  h-3.5
                  w-3.5
                " />

                <span className="
                  truncate
                ">

                  {contact.email}

                </span>

              </div>

            )}


          </div>


        </div>




        <ChevronRight className="
          h-5
          w-5
          text-muted-foreground
        " />


      </button>






      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-2
          border-t
          pt-3
        "
      >


        {phone && (

          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
          >

            <WhatsAppButton
              contact={contact}
            />

          </div>

        )}





        {contact.phone && (

          <a
            href={`tel:${contact.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="
              flex
              h-9
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              px-3
              text-sm
            "
          >

            <Phone className="
              h-4
              w-4
            " />

            Call

          </a>

        )}


      </div>


    </div>

  )

}