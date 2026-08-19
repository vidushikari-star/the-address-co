"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { ContactFormFields } from "@/components/contacts/contact-form-fields"
import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"
import {
  deleteCrmDraft,
  getCrmDraft,
  saveCrmDraft,
} from "@/lib/repositories/crm-draft-repository"
import type { Contact } from "@/types/contact"

function createInitialForm() {
  return {
    fullName: "",
    phone: "",
    email: "",
    whatsapp: "",
    city: "",
    country: "",
    relationshipTypes: [] as string[],
    leadSource: "referral",
    intent: "" as "sale" | "rental" | "both" | "",
    budgetMin: "",
    budgetMax: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    resident: "",
    minArea: "",
    maxArea: "",
    plotSize: "",
    purpose: "",
    financing: "",
    timeline: "",
    locations: "",
    mustHave: "",
    niceToHave: "",
    spouseName: "",
    coBuyer: "",
    referralSource: "",
    notes: "",
  }
}

type RelationshipFormProps = {
  active?: boolean
  onCancel?: () => void
  onCreated?: (contact: Contact) => void
}

export function RelationshipForm({
  active = true,
  onCancel,
  onCreated,
}: RelationshipFormProps) {
  const [loading, setLoading] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(createInitialForm)

  function update(key: string, value: string) {
    setForm(current => ({ ...current, [key]: value }))
  }

  function toggleRelationship(type: string) {
    setForm(current => ({
      ...current,
      relationshipTypes: current.relationshipTypes.includes(type)
        ? current.relationshipTypes.filter(item => item !== type)
        : [...current.relationshipTypes, type],
    }))
  }

  useEffect(() => {
    if (!active) return

    let cancelled = false
    setForm(createInitialForm())
    setDraftUpdatedAt(null)
    setError(null)

    getCrmDraft("relationship")
      .then(draft => {
        if (cancelled || !draft) return
        setForm(current => ({ ...current, ...draft.payload } as typeof current))
        setDraftUpdatedAt(draft.updatedAt)
      })
      .catch(draftError => {
        if (!cancelled) {
          console.error("Unable to load relationship draft", draftError)
          setError("Unable to load your saved relationship draft.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [active])

  async function saveDraft() {
    setSavingDraft(true)
    setError(null)

    try {
      const draft = await saveCrmDraft("relationship", form)
      setDraftUpdatedAt(draft.updatedAt)
    } catch (draftError) {
      console.error("Unable to save relationship draft", draftError)
      setError("Unable to save the relationship draft.")
    } finally {
      setSavingDraft(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const contact = await ContactsRepository.create({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email,
        whatsapp: form.whatsapp,
        city: form.city,
        country: form.country,
        relationshipTypes: form.relationshipTypes,
        leadSource: form.leadSource,
        intent: form.intent === "sale" || form.intent === "rental" || form.intent === "both" ? form.intent : undefined,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : undefined,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : undefined,
        propertyType: form.propertyType || undefined,
        bedrooms: form.bedrooms || undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        resident: form.resident || undefined,
        minArea: form.minArea ? Number(form.minArea) : undefined,
        maxArea: form.maxArea ? Number(form.maxArea) : undefined,
        plotSize: form.plotSize ? Number(form.plotSize) : undefined,
        purpose: form.purpose || undefined,
        financing: form.financing || undefined,
        timeline: form.timeline || undefined,
        locations: form.locations.split(",").map(item => item.trim()).filter(Boolean),
        mustHave: form.mustHave.split(",").map(item => item.trim()).filter(Boolean),
        niceToHave: form.niceToHave.split(",").map(item => item.trim()).filter(Boolean),
        spouseName: form.spouseName || undefined,
        coBuyer: form.coBuyer || undefined,
        referralSource: form.referralSource || undefined,
        notes: form.notes,
      })

      await deleteCrmDraft("relationship")
      setDraftUpdatedAt(null)
      onCreated?.(contact)
    } catch (submitError) {
      console.error("Failed creating relationship", submitError)
      setError("Unable to create relationship.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ContactFormFields
        form={form}
        update={update}
        toggleRelationship={toggleRelationship}
      />

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} disabled={loading || savingDraft}>Cancel</Button>}
        <Button type="button" variant="outline" onClick={saveDraft} disabled={loading || savingDraft}>{savingDraft ? "Saving draft..." : "Save Draft"}</Button>
        <Button type="submit" disabled={loading || savingDraft}>{loading ? "Saving..." : "Create Relationship"}</Button>
        {draftUpdatedAt && <span className="text-xs text-muted-foreground">Draft saved {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(draftUpdatedAt))}</span>}
      </div>
    </form>
  )
}
