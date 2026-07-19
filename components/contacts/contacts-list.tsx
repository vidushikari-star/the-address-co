import { contacts } from "@/lib/mock-data/contacts/contacts"

import { ContactCard } from "./contact-card"

export function ContactsList() {
  return (
    <div className="space-y-4">
      {contacts.map((contact) => (
        <ContactCard
          key={contact.id}
          contact={contact}
        />
      ))}
    </div>
  )
}