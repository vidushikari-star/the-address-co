"use client"

import Link from "next/link"

import type { Contact } from "@/types/contact"

import { getProperties } from "@/lib/repositories/property-repository"
import { getPropertyMatches } from "@/lib/services/property-matching"

import {
  ArrowUpRight,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type RelationshipPropertiesProps = {
  contact: Contact
}

export function RelationshipProperties({
  contact,
}: RelationshipPropertiesProps) {
  const properties = getProperties()

  const matches = getPropertyMatches(
    contact,
    properties
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recommended Properties
          </CardTitle>

          <p className="mt-1 text-sm text-muted-foreground">
            Ranked based on buyer preferences.
          </p>
        </div>

        <Link href="/properties">
  <Button
    variant="ghost"
    size="sm"
  >
    View All
  </Button>
</Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {matches.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No recommendations available.
          </div>
        ) : (
          matches.slice(0, 5).map((match) => (
            <div
              key={match.property.id}
              className="rounded-xl border p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">
                    {match.property.name}
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {match.property.locality},{" "}
                    {match.property.location}
                  </p>
                </div>

                <Badge>
                  {match.score}%
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {match.reasons.map((reason) => (
                  <Badge
                    key={reason}
                    variant="secondary"
                  >
                    {reason}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
               <Link
  href={`/properties/${match.property.slug}`}
>
  <Button
    variant="ghost"
    size="icon"
  >
    <ArrowUpRight className="h-4 w-4" />
  </Button>
</Link>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}