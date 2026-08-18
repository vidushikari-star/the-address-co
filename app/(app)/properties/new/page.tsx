"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"

import { createPropertyAction } from "@/lib/actions/property-actions"
import { getCreatedPropertyPath } from "@/lib/properties/property-schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { deleteCrmDraft, getCrmDraft, saveCrmDraft } from "@/lib/repositories/crm-draft-repository"

const propertyTypes = ["Villa", "Apartment", "Plot", "Penthouse", "Commercial"]
const statuses = ["available", "viewed", "shortlisted", "offer", "purchased", "rejected", "archived"]

function optionalNumber(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
}

function splitList(value: string) {
  return value.split(",").map(item => item.trim()).filter(Boolean)
}

export default function NewPropertyPage() {
  const router = useRouter()
  const requestIdRef = useRef<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    slug: "",
    developer: "",
    transactionType: "Sale",
    listingType: "Primary",
    developmentStage: "ready_to_move",
    propertyType: "Villa",
    status: "available",
    location: "",
    locality: "",
    googleMapLink: "",
    price: "",
    rent: "",
    securityDeposit: "",
    bedrooms: "",
    bathrooms: "",
    carpetArea: "",
    plotArea: "",
    builtUpArea: "",
    furnishing: "",
    amenities: "",
    description: "",
    tags: "",
    coverImage: "",
    advisor: "",
    note: "",
    housingEnabled: false,
  })

  function update(key: keyof typeof form, value: string | boolean) {
    setForm(current => ({ ...current, [key]: value }))
  }

  useEffect(() => {
    getCrmDraft("property")
      .then(draft => {
        if (!draft) return
        setForm(current => ({ ...current, ...draft.payload } as typeof current))
        setDraftUpdatedAt(draft.updatedAt)
      })
      .catch(error => console.error("Unable to load property draft", error))
  }, [])

  async function saveDraft() {
    setSavingDraft(true)
    setError(null)
    try {
      const draft = await saveCrmDraft("property", form)
      setDraftUpdatedAt(draft.updatedAt)
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : "Unable to save the property draft.")
    } finally {
      setSavingDraft(false)
    }
  }

  async function saveProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const requestId = requestIdRef.current ?? crypto.randomUUID()
    requestIdRef.current = requestId

    const result = await createPropertyAction({
      requestId,
      name: form.name,
      slug: form.slug || undefined,
      developer: form.developer || undefined,
      transactionType: form.transactionType as "Sale" | "Rental",
      listingType: form.listingType as "Primary" | "Resale",
      developmentStage: form.developmentStage as "ready_to_move" | "under_construction" | "resale",
      propertyType: form.propertyType as "Apartment" | "Villa" | "Plot" | "Penthouse" | "Commercial",
      status: form.status as "available" | "viewed" | "shortlisted" | "offer" | "purchased" | "rejected" | "archived",
      location: form.location || undefined,
      locality: form.locality || undefined,
      googleMapLink: form.googleMapLink || undefined,
      price: form.transactionType === "Sale" ? optionalNumber(form.price) : undefined,
      rent: form.transactionType === "Rental" ? optionalNumber(form.rent) : undefined,
      securityDeposit: form.transactionType === "Rental" ? optionalNumber(form.securityDeposit) : undefined,
      bedrooms: optionalNumber(form.bedrooms),
      bathrooms: optionalNumber(form.bathrooms),
      carpetArea: optionalNumber(form.carpetArea),
      plotArea: optionalNumber(form.plotArea),
      builtUpArea: optionalNumber(form.builtUpArea),
      furnishing: (form.furnishing || undefined) as "furnished" | "semi_furnished" | "unfurnished" | undefined,
      amenities: splitList(form.amenities),
      description: form.description || undefined,
      tags: splitList(form.tags),
      coverImage: form.coverImage || undefined,
      advisor: form.advisor || undefined,
      note: form.note || undefined,
      housingEnabled: form.housingEnabled,
    })

    if (!result.ok) {
      setError(result.error)
      setSaving(false)
      return
    }

    await deleteCrmDraft("property")
    router.push(getCreatedPropertyPath(result.property.slug))
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">New Property</h1>
          <p className="text-muted-foreground">Add a property to your inventory.</p>
        </div>
      </div>

      <form onSubmit={saveProperty} className="space-y-5 rounded-2xl border bg-card p-4 sm:p-8">
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2"><span className="text-sm font-medium">Property name</span><Input required placeholder="Property Name" value={form.name} onChange={event => update("name", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Slug</span><Input placeholder="Generated from the name if blank" value={form.slug} onChange={event => update("slug", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Developer</span><Input placeholder="Developer (optional)" value={form.developer} onChange={event => update("developer", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Advisor</span><Input placeholder="Advisor (optional)" value={form.advisor} onChange={event => update("advisor", event.target.value)} /></label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2"><span className="text-sm font-medium">Transaction</span><select className="w-full rounded-lg border bg-background p-3" value={form.transactionType} onChange={event => update("transactionType", event.target.value)}><option value="Sale">Sale</option><option value="Rental">Rent</option></select></label>
          <label className="space-y-2"><span className="text-sm font-medium">Construction / possession</span><select className="w-full rounded-lg border bg-background p-3" value={form.developmentStage} onChange={event => update("developmentStage", event.target.value)}><option value="ready_to_move">Ready to Move</option><option value="under_construction">Under Construction</option><option value="resale">Resale</option></select></label>
          <label className="space-y-2"><span className="text-sm font-medium">Furnishing</span><select className="w-full rounded-lg border bg-background p-3" value={form.furnishing} onChange={event => update("furnishing", event.target.value)}><option value="">Not specified</option><option value="furnished">Furnished</option><option value="semi_furnished">Semi-furnished</option><option value="unfurnished">Unfurnished</option></select></label>
          <label className="space-y-2"><span className="text-sm font-medium">Listing type</span><select className="w-full rounded-lg border bg-background p-3" value={form.listingType} onChange={event => update("listingType", event.target.value)}><option value="Primary">Primary</option><option value="Resale">Resale</option></select></label>
          <label className="space-y-2"><span className="text-sm font-medium">Property type</span><select className="w-full rounded-lg border bg-background p-3" value={form.propertyType} onChange={event => update("propertyType", event.target.value)}>{propertyTypes.map(type => <option key={type} value={type}>{type}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-medium">CRM status</span><select className="w-full rounded-lg border bg-background p-3" value={form.status} onChange={event => update("status", event.target.value)}>{statuses.map(status => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2"><span className="text-sm font-medium">City / location</span><Input placeholder="Location (optional)" value={form.location} onChange={event => update("location", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Locality</span><Input placeholder="Locality (optional)" value={form.locality} onChange={event => update("locality", event.target.value)} /></label>
        </div>
        <label className="space-y-2"><span className="text-sm font-medium">Google Maps link</span><Input type="url" placeholder="https://… (optional)" value={form.googleMapLink} onChange={event => update("googleMapLink", event.target.value)} /></label>

        {form.transactionType === "Rental" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2"><span className="text-sm font-medium">Monthly rent</span><Input type="number" min="0" placeholder="Optional" value={form.rent} onChange={event => update("rent", event.target.value)} /></label>
            <label className="space-y-2"><span className="text-sm font-medium">Security deposit</span><Input type="number" min="0" placeholder="Optional" value={form.securityDeposit} onChange={event => update("securityDeposit", event.target.value)} /></label>
          </div>
        ) : <label className="space-y-2"><span className="text-sm font-medium">Asking price</span><Input type="number" min="0" placeholder="Optional" value={form.price} onChange={event => update("price", event.target.value)} /></label>}

        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2"><span className="text-sm font-medium">Bedrooms</span><Input type="number" min="0" placeholder="Optional" value={form.bedrooms} onChange={event => update("bedrooms", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Bathrooms</span><Input type="number" min="0" placeholder="Optional" value={form.bathrooms} onChange={event => update("bathrooms", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Carpet area (sq ft)</span><Input type="number" min="0" placeholder="Optional" value={form.carpetArea} onChange={event => update("carpetArea", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Plot area (sq m)</span><Input type="number" min="0" placeholder="Optional" value={form.plotArea} onChange={event => update("plotArea", event.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Built-up area (sq ft)</span><Input type="number" min="0" placeholder="Optional" value={form.builtUpArea} onChange={event => update("builtUpArea", event.target.value)} /></label>
        </div>

        <label className="space-y-2"><span className="text-sm font-medium">Amenities</span><Input placeholder="Comma separated (optional)" value={form.amenities} onChange={event => update("amenities", event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium">Tags</span><Input placeholder="Comma separated (optional)" value={form.tags} onChange={event => update("tags", event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium">Cover image URL</span><Input type="url" placeholder="Optional; more media can be uploaded after saving" value={form.coverImage} onChange={event => update("coverImage", event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium">Description</span><Textarea placeholder="Property description (optional)" value={form.description} onChange={event => update("description", event.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium">Internal note</span><Textarea placeholder="Optional; never sent to external portals" value={form.note} onChange={event => update("note", event.target.value)} /></label>

        <label className="flex items-start gap-3 rounded-xl border p-4">
          <input className="mt-1 h-4 w-4" type="checkbox" checked={form.housingEnabled} onChange={event => update("housingEnabled", event.target.checked)} />
          <span><span className="block text-sm font-medium">Syndicate to Housing.com</span><span className="block text-sm text-muted-foreground">Only enabled, active, complete listings appear in the Housing inventory feed.</span></span>
        </label>

        <div className="flex flex-wrap items-center gap-3"><Button type="button" variant="outline" onClick={saveDraft} disabled={saving || savingDraft}>{savingDraft ? "Saving draft…" : "Save Draft"}</Button><Button type="submit" disabled={saving || savingDraft} className="w-full sm:w-auto">{saving ? "Saving property…" : "Save Property"}</Button>{draftUpdatedAt && <span className="text-xs text-muted-foreground">Draft saved {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(draftUpdatedAt))}</span>}</div>
      </form>
    </div>
  )
}
