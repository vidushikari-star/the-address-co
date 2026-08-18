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
  getPropertiesByIds,
} from "@/lib/repositories/property-repository"
import {
  getPropertySharesWithAdvisorByContactId,
  type PropertyShare,
} from "@/lib/repositories/property-share-repository"
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
  const [sharedProperties, setSharedProperties] =
    useState<Array<{ property: Property; share: PropertyShare }>>([])
  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)

      try {
        const [properties, shares] = await Promise.all([
          getProperties(),
          getPropertySharesWithAdvisorByContactId(contact.id),
        ])
        const recommendations = getPropertyMatches(contact, properties)
          .map(match => match.property)
          .slice(0, 5)

        if (mounted) {
          setRecommendedProperties(recommendations)
          const sharedById = new Map(
            (await getPropertiesByIds(
              shares
                .map((share) => share.propertyId)
                .filter(Boolean)
            )).map((property) => [property.id, property])
          )
          setSharedProperties(
            shares.flatMap((share) => {
              const property = sharedById.get(share.propertyId)
              return property ? [{ property, share }] : []
            })
          )
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
    <div className="space-y-4">
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

      <Card className="rounded-2xl">
        <CardHeader className="px-4 py-3">
          <CardTitle className="flex items-center justify-between text-base">
            <span>Shared Properties</span>
            <Badge variant="secondary">{sharedProperties.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading shared properties...</p>
          ) : sharedProperties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No properties have been shared with this relationship yet.</p>
          ) : (
            sharedProperties.map(({ property, share }) => (
              <div key={share.id} className="space-y-1">
                <RecommendedPropertyCard
                  property={property}
                  label="shared"
                  status={share.status}
                  sharedAt={share.sharedAt}
                  shareId={share.id}
                  contactId={contact.id}
                />
                {share.advisorName && (
                  <p className="px-1 text-xs text-muted-foreground">
                    Shared by {share.advisorName}
                  </p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
