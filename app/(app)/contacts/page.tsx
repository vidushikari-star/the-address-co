import { PageContainer } from "@/components/layout/page-container"
import { Section } from "@/components/layout/section"

import { ContactsHeader } from "@/components/contacts/contacts-header"
import { ContactStats } from "@/components/contacts/contact-stats"
import { ContactsToolbar } from "@/components/contacts/contacts-toolbar"
import { ContactsList } from "@/components/contacts/contacts-list"

export default function ContactsPage() {
  return (
    <PageContainer>
      <ContactsHeader />

      <ContactStats />

      <ContactsToolbar />

      <Section>
        <ContactsList />
      </Section>
    </PageContainer>
  )
}