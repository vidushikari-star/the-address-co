"use client"

import { useEffect, useMemo, useState } from "react"

import { ContactCard } from "./contact-card"
import { ContactHeader } from "./contact-header"
import { ContactToolbar } from "./contact-toolbar"

import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"

import type { Contact } from "@/types/contact"

export function ContactList() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    async function loadContacts() {
      try {
        const data = await ContactsRepository.getAll()

        setContacts(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadContacts()
  }, [])

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        query === "" ||
        contact.name
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        (contact.email ?? "")
          .toLowerCase()
          .includes(query.toLowerCase()) ||
        contact.phone.includes(query)

      return matchesSearch
    })
  }, [contacts, query])

  return (
    <div className="space-y-6">
      <ContactHeader />

      <ContactToolbar
        query={query}
        onQueryChange={setQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
      />

      {loading ? (
        <div className="rounded-2xl border p-10 text-center">
          Loading contacts...
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No contacts found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
            />
          ))}
        </div>
      )}
    </div>
  )
}