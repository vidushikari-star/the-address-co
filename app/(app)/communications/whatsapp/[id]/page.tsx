import { notFound } from "next/navigation"

import { WhatsAppConversation } from "@/components/communications/whatsapp/whatsapp-conversation"

import { WhatsAppServerRepository } from "@/lib/supabase/repositories/whatsapp-server.repository"
import { mapContactRow } from "@/lib/mappers/contact.mapper"


type PageProps = {
  params: Promise<{
    id: string
  }>
}


export default async function WhatsAppConversationPage({
  params,
}: PageProps) {


  const {
    id,
  } = await params



  const [
  conversation,
  messages,
] = await Promise.all([

  WhatsAppServerRepository.getConversation(id),

  WhatsAppServerRepository.getMessages(id),

])



  if (!conversation) {
    notFound()
  }

  const contact =
    conversation.contact
      ? mapContactRow(conversation.contact)
      : undefined



  return (

    <WhatsAppConversation

  conversation={
    conversation
  }

  messages={
    messages
  }

  contact={
    contact
  }

/>

  )

}
