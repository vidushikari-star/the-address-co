"use client"

import type { Contact } from "@/types"

import { RelationshipHeader } from "./relationship-header"
import { RelationshipSnapshot } from "./relationship-snapshot"
import { RelationshipTimeline } from "./relationship-timeline"
import { RelationshipProperties } from "./relationship-properties"
import { RelationshipTasks } from "./relationship-tasks"

type RelationshipDetailProps = {
  contact: Contact
}

export function RelationshipDetail({
  contact,
}: RelationshipDetailProps) {
  return (
    <div className="flex flex-col">
      <RelationshipHeader contact={contact} />

      <div className="grid gap-6 p-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <RelationshipSnapshot contact={contact} />

        <RelationshipTimeline contact={contact} />

        <div className="space-y-6">
          <RelationshipProperties contact={contact} />
          <RelationshipTasks contact={contact} />
        </div>
      </div>
    </div>
  )
}