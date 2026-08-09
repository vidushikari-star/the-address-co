"use client"

import { useEffect, useState } from "react"

import Link from "next/link"

import {
  WhatsAppRepository,
} from "@/lib/supabase/repositories/whatsapp.repository"
import type {
  WhatsAppConversationRow,
} from "@/lib/supabase/repositories/whatsapp.repository"


export function WhatsAppInbox() {

  const [conversations, setConversations] =
    useState<WhatsAppConversationRow[]>([])


  const [loading, setLoading] =
    useState(true)



  useEffect(() => {

    async function load() {

      try {

        const data =
          await WhatsAppRepository.getConversations()

        setConversations(data)

      } finally {

        setLoading(false)

      }

    }


    load()

  }, [])



  return (

    <div className="
      space-y-6
      p-6
    ">


      <div>

        <h1 className="
          text-2xl
          font-semibold
        ">
          WhatsApp Inbox
        </h1>

        <p className="
          text-sm
          text-muted-foreground
        ">
          Manage incoming WhatsApp enquiries and convert them into CRM leads.
        </p>

      </div>



      <div className="
        overflow-hidden
        rounded-xl
        border
        divide-y
      ">


        {loading && (

          <div className="
            p-8
            text-center
            text-sm
            text-muted-foreground
          ">

            Loading conversations...

          </div>

        )}




        {!loading &&
          conversations.map(
            (conversation) => (

              <Link

                key={conversation.id}

                href={
                  `/communications/whatsapp/${conversation.id}`
                }

                className="
                  block
                  p-4
                  transition
                  hover:bg-muted/50
                "

              >

                <div className="
                  flex
                  items-center
                  justify-between
                  gap-4
                ">


                  <div className="min-w-0">

                    <div className="
                      font-medium
                    ">

                      {
                        conversation.contact_name ??
                        conversation.phone_number
                      }

                    </div>


                    <div className="
                      mt-1
                      truncate
                      text-sm
                      text-muted-foreground
                    ">

                      {
                        conversation.last_message ??
                        "No message"
                      }

                    </div>


                  </div>



                  <div className="
                    shrink-0
                    text-xs
                    text-muted-foreground
                  ">

                    {
                      conversation.status
                    }

                  </div>


                </div>


              </Link>

            )
          )
        }




        {!loading &&
          conversations.length === 0 && (

            <div className="
              p-8
              text-center
              text-sm
              text-muted-foreground
            ">

              No WhatsApp conversations yet.

            </div>

          )
        }


      </div>


    </div>

  )

}
