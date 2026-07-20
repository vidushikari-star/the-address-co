"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"
import { getProperties } from "@/lib/repositories/property-repository"
import { getDeals } from "@/lib/repositories/deal-repository"

import type { Contact } from "@/types/contact"

export function GlobalSearch() {
  const [query, setQuery] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])

  const properties = getProperties()
  const deals = getDeals()

  useEffect(() => {
    async function loadContacts() {
      try {
        const data =
          await ContactsRepository.getAll()

        setContacts(data)
      } catch (error) {
        console.error(
          "Failed loading contacts",
          error
        )
      }
    }

    loadContacts()
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return []

    const q = query.toLowerCase()

    return [
      ...contacts
        .filter((c) =>
          c.name
            .toLowerCase()
            .includes(q)
        )
        .map((c) => ({
          id: `contact-${c.id}`,
          label: c.name,
          type: "Buyer",
          href: `/contacts/${c.id}`,
        })),

      ...properties
        .filter((p) =>
          p.name
            .toLowerCase()
            .includes(q)
        )
        .map((p) => ({
          id: `property-${p.id}`,
          label: p.name,
          type: "Property",
          href: `/properties/${p.slug}`,
        })),

      ...deals
        .filter((d) =>
          d.name
            .toLowerCase()
            .includes(q)
        )
        .map((d) => ({
          id: `deal-${d.id}`,
          label: d.name,
          type: "Deal",
          href: `/deals/${d.id}`,
        })),
    ].slice(0, 8)
  }, [
    query,
    contacts,
    properties,
    deals,
  ])

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        value={query}
        onChange={(e) =>
          setQuery(e.target.value)
        }
        placeholder="Search buyers, properties, deals..."
        className="pl-10"
      />

      {results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border bg-popover shadow-lg">
          {results.map((result) => (
            <Link
              key={result.id}
              href={result.href}
              onClick={() =>
                setQuery("")
              }
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted"
            >
              <span>
                {result.label}
              </span>

              <span className="text-xs text-muted-foreground">
                {result.type}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}