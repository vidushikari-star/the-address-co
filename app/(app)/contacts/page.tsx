import { ContactList } from "@/components/contacts/list/contact-list"


type Props = {
  searchParams: Promise<{
    stage?: string
    follow_up?: string
    assigned_to?: string
  }>
}


export default async function ContactsPage({
  searchParams,
}: Props) {


  const params =
    await searchParams


  return (

    <ContactList
      stageFilter={
        params.stage
      }
      followUpFilter={
        params.follow_up
      }
      assignedToMe={
        params.assigned_to === "me"
      }
    />

  )

}
