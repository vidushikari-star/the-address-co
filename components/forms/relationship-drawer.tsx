"use client"

import { useRouter } from "next/navigation"

import { RelationshipForm } from "@/components/contacts/relationship-form"
import { FormDrawer } from "./form-drawer"

type RelationshipDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RelationshipDrawer({
  open,
  onOpenChange,
}: RelationshipDrawerProps) {
  const router = useRouter()

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="New Relationship"
      description="Add a buyer, seller, investor or business contact."
    >
      <RelationshipForm
        active={open}
        onCancel={() => onOpenChange(false)}
        onCreated={() => {
          onOpenChange(false)
          router.refresh()
        }}
      />
    </FormDrawer>
  )
}
