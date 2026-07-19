import { Plus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"

export function ContactsHeader() {
  return (
    <PageHeader
      eyebrow="Contacts"
      title="Relationships"
      description="Manage buyers, sellers, investors, developers and every important relationship across your business."
      actions={
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          New Relationship
        </Button>
      }
    />
  )
}