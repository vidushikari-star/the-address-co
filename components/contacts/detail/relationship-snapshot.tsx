"use client"

import type { Contact } from "@/types"

import {
  BadgeIndianRupee,
  CalendarClock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

type RelationshipSnapshotProps = {
  contact: Contact
}

export function RelationshipSnapshot({
  contact,
}: RelationshipSnapshotProps) {
  const locations = contact.locations ?? []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {contact.phone || "Not provided"}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            {contact.email || "Not provided"}
          </div>

          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            Buyer
          </div>

          {contact.city && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {contact.city}
              {contact.country
                ? `, ${contact.country}`
                : ""}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requirements</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {(contact.budgetMin ||
            contact.budgetMax) && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                <BadgeIndianRupee className="h-4 w-4" />
                Budget
              </div>

              <p className="text-sm text-muted-foreground">
                ₹
                {contact.budgetMin?.toLocaleString() ??
                  "—"}{" "}
                – ₹
                {contact.budgetMax?.toLocaleString() ??
                  "—"}
              </p>
            </div>
          )}

          {contact.propertyType && (
            <>
              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium">
                  Property Type
                </p>

                <Badge variant="secondary">
                  {contact.propertyType}
                </Badge>
              </div>
            </>
          )}

          {locations.length > 0 && (
            <>
              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium">
                  Preferred Locations
                </p>

                <div className="flex flex-wrap gap-2">
                  {locations.map((location) => (
                    <Badge
                      key={location}
                      variant="outline"
                    >
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {contact.bedrooms && (
            <>
              <Separator />

              <div>
                <p className="mb-2 text-sm font-medium">
                  Bedrooms
                </p>

                <Badge>
                  {contact.bedrooms} BHK
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CRM</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Advisor
            </span>

            <span className="font-medium">
              {contact.assignedAdvisor ??
                "Unassigned"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Source
            </span>

            <span className="font-medium">
              {contact.source ??
                "Unknown"}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Timeline
            </span>

            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-muted-foreground" />

              <span className="font-medium">
                {contact.timeline ??
                  "Not specified"}
              </span>
            </div>
          </div>

          {locations.length > 0 && (
            <div className="flex items-start justify-between gap-3 text-sm">
              <span className="text-muted-foreground">
                Preferred Areas
              </span>

              <div className="flex max-w-[180px] flex-wrap justify-end gap-1">
                {locations.map((area) => (
                  <Badge
                    key={area}
                    variant="outline"
                  >
                    <MapPin className="mr-1 h-3 w-3" />
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}