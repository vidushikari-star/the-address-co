"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"

import { FormInput } from "./form-input"
import { FormSelect } from "./form-select"
import { FormSection } from "./form-section"

import {
  createContactSchema,
  type CreateContactInput,
} from "@/lib/schemas/contact.schema"

type BuyerFormProps = {
  loading?: boolean
  onCancel?: () => void
  onSubmit?: (
    data: CreateContactInput
  ) => Promise<void> | void
}

export function BuyerForm({
  loading = false,
  onCancel,
  onSubmit,
}: BuyerFormProps) {
  const form = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      city: "",
      country: "",
      preferredLanguage: "",
      whatsapp: "",
    },
  })

  async function handleSubmit(
    data: CreateContactInput
  ) {
    await onSubmit?.(data)
    form.reset()
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-8"
      >
        <FormSection
          title="Buyer Information"
          description="Basic buyer details."
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormInput
              control={form.control}
              name="fullName"
              label="Full Name"
              required
              disabled={loading}
            />

            <FormInput
              control={form.control}
              name="phone"
              label="Phone"
              required
              disabled={loading}
            />

            <FormInput
              control={form.control}
              name="email"
              label="Email"
              type="email"
              disabled={loading}
            />

            <FormInput
              control={form.control}
              name="city"
              label="City"
              disabled={loading}
            />

            <FormInput
              control={form.control}
              name="country"
              label="Country"
              disabled={loading}
            />

            <FormInput
              control={form.control}
              name="whatsapp"
              label="WhatsApp"
              disabled={loading}
            />

            <FormSelect
              control={form.control}
              name="preferredLanguage"
              label="Preferred Language"
              placeholder="Select language"
              disabled={loading}
              options={[
                {
                  label: "English",
                  value: "english",
                },
                {
                  label: "Hindi",
                  value: "hindi",
                },
                {
                  label: "Konkani",
                  value: "konkani",
                },
              ]}
            />
          </div>
        </FormSection>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              loading || !form.formState.isValid
            }
          >
            {loading ? "Saving..." : "Save Buyer"}
          </Button>
        </div>
      </form>
    </Form>
  )
}