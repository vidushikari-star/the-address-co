import { ContactList } from "@/components/contacts/list/contact-list"


type Props = {
  searchParams: Promise<{
    stage?: string
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
    />

  )

}