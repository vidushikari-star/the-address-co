"use client"

import { useState } from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowLeft } from "lucide-react"

import {
  createContactFromWhatsApp,
  qualifyConversation,
} from "@/app/(app)/communications/actions"

import { Button } from "@/components/ui/button"

import { QualificationCard } from "@/components/communications/whatsapp/qualification-card"

import type { Contact } from "@/types"
import type {
  WhatsAppConversationRow,
  WhatsAppMessageRow,
} from "@/lib/supabase/repositories/whatsapp.repository"
import type {
  WhatsAppQualification,
} from "@/lib/communications/qualify-whatsapp"

const qualificationIntents = [
  "BUY",
  "SELL",
  "RENT",
  "LEASE",
  "UNKNOWN",
] as const

function parseQualification(
  value: unknown
): WhatsAppQualification | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const qualification = value as Partial<WhatsAppQualification>

  if (!qualificationIntents.includes(
    qualification.intent as WhatsAppQualification["intent"]
  )) {
    return null
  }

  return qualification as WhatsAppQualification
}

type WhatsAppConversationProps = {

  conversation: WhatsAppConversationRow

  messages: WhatsAppMessageRow[]

  contact?: Contact

}



export function WhatsAppConversation({

  conversation,

  messages,

  contact,

}: WhatsAppConversationProps) {

  const router = useRouter()


  const [creating, setCreating] =
    useState(false)


  const [qualifying, setQualifying] =
    useState(false)


  const [created, setCreated] =
    useState(
      Boolean(conversation.contact_id)
    )


  const [qualification, setQualification] =
    useState<WhatsAppQualification | null>(
      parseQualification(conversation.qualification)
    )

  const [error, setError] =
    useState<string | null>(null)





  async function handleCreateContact() {

    setCreating(true)
    setError(null)

    try {

      await createContactFromWhatsApp(
        conversation.id
      )


      setCreated(true)
      router.refresh()

    } catch (createError) {

      console.error("Unable to create WhatsApp contact", createError)
      setError("Unable to create the contact. Please try again.")

    }
    finally {

      setCreating(false)

    }

  }





  async function handleQualifyLead() {

    setQualifying(true)
    setError(null)

    try {

      const result =
        await qualifyConversation(
          conversation.id
        )


      setQualification(
        parseQualification(result.qualification)
      )
      router.refresh()

    } catch (qualificationError) {

      console.error("Unable to qualify WhatsApp lead", qualificationError)
      setError("Unable to qualify this lead. Please try again.")

    }
    finally {

      setQualifying(false)

    }

  }





  return (

    <div className="
      flex
      min-h-full
      flex-col
      gap-6
      p-6
    ">


      <div className="
        flex
        items-center
        gap-3
      ">

        <Link href="/communications/whatsapp">

          <Button
            variant="outline"
            size="sm"
          >

            <ArrowLeft className="mr-2 h-4 w-4" />

            Back

          </Button>

        </Link>



        <div>

          <h1 className="
            text-2xl
            font-semibold
          ">

            {
              conversation.contact_name ??
              conversation.phone_number
            }

          </h1>


          <p className="
            text-sm
            text-muted-foreground
          ">

            {
              conversation.phone_number
            }

          </p>

        </div>

      </div>


      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}





      {
        qualification && (

          <QualificationCard
  qualification={
    qualification
  }
  contact={
    contact
  }
/>

        )
      }





      <div className="
        rounded-xl
        border
        p-4
        space-y-4
      ">


        <div className="
          text-sm
          font-medium
        ">

          Conversation

        </div>



        {
          messages.length === 0 && (

            <div className="
              text-sm
              text-muted-foreground
            ">

              No messages yet.

            </div>

          )
        }



        {
          messages.map(
            (message) => (

              <div
                key={message.id}
                className={`
                  rounded-lg
                  p-3
                  text-sm
                  ${
                    message.direction === "incoming"
                      ? "bg-muted"
                      : "bg-primary/10"
                  }
                `}
              >

                {message.message}

              </div>

            )
          )
        }



        {
          messages.length === 0 &&
          conversation.last_message && (

            <div className="
              rounded-lg
              bg-muted
              p-3
              text-sm
            ">

              {
                conversation.last_message
              }

            </div>

          )
        }


      </div>





      <div className="
        rounded-xl
        border
        p-4
        space-y-4
      ">


        <h2 className="
          font-medium
        ">

          Qualification Actions

        </h2>



        <Button
          variant="outline"
          onClick={handleQualifyLead}
          disabled={qualifying}
        >

          {
            qualifying
              ? "Analysing..."
              : qualification
                ? "Re-qualify Lead"
                : "Qualify Lead"
          }

        </Button>


      </div>





      <div className="
        rounded-xl
        border
        p-4
        space-y-4
      ">


        <h2 className="
          font-medium
        ">

          Lead Actions

        </h2>



        {
          created ? (

            <div className="
              rounded-lg
              bg-muted
              p-3
              text-sm
            ">

              Contact has been added to CRM.

            </div>

          ) : (

            <Button
              onClick={handleCreateContact}
              disabled={creating}
            >

              {
                creating
                  ? "Creating Contact..."
                  : "Create Contact"
              }

            </Button>

          )
        }


      </div>


    </div>

  )

}
