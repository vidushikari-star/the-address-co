"use client"

import type { Contact } from "@/types"

import {
  Building2,
  Edit,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type RelationshipHeaderProps = {
  contact: Contact
}

export function RelationshipHeader({
  contact,
}: RelationshipHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback>
              {contact.name
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {contact.name}
              </h1>

              <Badge variant="secondary">
                {contact.stage.replace(/_/g, " ")}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
              {contact.budgetMin !== undefined &&
                contact.budgetMax !== undefined && (
                  <div>
                    ₹
                    {contact.budgetMin.toLocaleString()} – ₹
                    {contact.budgetMax.toLocaleString()}
                  </div>
                )}

              {contact.propertyType && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {contact.propertyType}
                </div>
              )}

              {contact.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {contact.city}
                  {contact.country
                    ? `, ${contact.country}`
                    : ""}
                </div>
              )}

              <div>
                {contact.assignedAdvisor ??
                  "Unassigned"}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            <Phone className="mr-2 h-4 w-4" />
            Call
          </Button>

          <Button variant="outline" size="sm">
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </Button>

          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </Button>

          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
    </header>
  )
}