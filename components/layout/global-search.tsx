"use client"

import { useEffect, useState } from "react"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import type { Property } from "@/types/property"
import type { Contact } from "@/types/contact"


export function GlobalSearch() {

  const [
    properties,
    setProperties,
  ] = useState<Property[]>([])


  const [
    contacts,
    setContacts,
  ] = useState<Contact[]>([])


  const [
    query,
    setQuery,
  ] = useState("")


  useEffect(() => {

    async function loadData() {

      try {

        const [
          propertyData,
          contactData,
        ] = await Promise.all([
          getProperties(),
          ContactsRepository.getAll(),
        ])


        setProperties(
          propertyData
        )

        setContacts(
          contactData
        )

      } catch (error) {

        console.error(
          "Search loading failed",
          error
        )

      }

    }


    loadData()

  }, [])



  const q =
    query.toLowerCase()



  const filteredProperties =
    q
      ? properties.filter(
          (p) =>
            p.name
              .toLowerCase()
              .includes(q)
        )
      : []


  const filteredContacts =
    q
      ? contacts.filter(
          (c) =>
            c.name
              .toLowerCase()
              .includes(q) ||
            (c.email ?? "")
              .toLowerCase()
              .includes(q)
        )
      : []



  return (
    <div className="space-y-3">

      <input
        value={query}
        onChange={(e) =>
          setQuery(e.target.value)
        }
        placeholder="Search..."
        className="w-full rounded-lg border px-3 py-2"
      />


      {filteredContacts.map(
        (contact) => (
          <div key={contact.id}>
            {contact.name}
          </div>
        )
      )}


      {filteredProperties.map(
        (property) => (
          <div key={property.id}>
            {property.name}
          </div>
        )
      )}

    </div>
  )
}