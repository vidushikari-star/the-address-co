"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  Contact,
} from "@/types/contact"
import type {
  Property,
} from "@/types/property"

import {
  getProperties,
} from "@/lib/repositories/property-repository"
import {
  getPropertyMatches,
} from "@/lib/services/property-matching"

import {
  RecommendedPropertyCard,
} from "./recommended-property-card"
import {
  Badge,
} from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Props = {
  contact: Contact
}

export function RelationshipProperties({
  contact,
}: Props) {
  const [recommendedProperties, setRecommendedProperties] =
    useState<Property[]>([])
  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)

      try {
        const properties = await getProperties()
        const recommendations = getPropertyMatches(contact, properties)
          .map(match => match.property)
          .slice(0, 5)

        if (mounted) {
          setRecommendedProperties(recommendations)
        }
      } catch (error) {
        console.error("Loading recommended properties failed", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [contact])

  return (
    <Card className="rounded-2xl">
      <CardHeader className="px-4 py-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Recommended Matches</span>
          <Badge variant="secondary">{recommendedProperties.length}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-5">
        {loading ? (
          <p className="text-sm text-muted-foreground">
            Finding matching properties...
          </p>
        ) : recommendedProperties.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No matching properties found.
          </p>
        ) : (
          recommendedProperties.map(property => (
            <RecommendedPropertyCard
              key={property.id}
              property={property}
              label="recommended"
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
