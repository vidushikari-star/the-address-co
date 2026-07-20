"use client"

import { useState } from "react"

import { BuyerForm } from "./buyer-form"
import { FormDrawer } from "./form-drawer"

import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"
import type { CreateContactInput } from "@/lib/schemas/contact.schema"

type BuyerDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BuyerDrawer({
  open,
  onOpenChange,
}: BuyerDrawerProps) {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(data: CreateContactInput) {
    try {
      setLoading(true)

      await ContactsRepository.create(data)

      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="New Buyer"
      description="Capture buyer details."
    >
      <BuyerForm
        loading={loading}
        onCancel={() => onOpenChange(false)}
        onSubmit={handleSubmit}
      />
    </FormDrawer>
  )
}