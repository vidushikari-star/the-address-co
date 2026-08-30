"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type MediaOption = {
  id: string
  label: string
  publicShareAllowed: boolean
}

type Props = {
  /** Server-authorized capability; the PATCH route remains authoritative. */
  canManage: boolean
  property: {
    id: string
    publicShareToken?: string
    publicShareEnabled?: boolean
    publicShareShowPrice?: boolean
    publicShareShowAdvisorContact?: boolean
    publicShareShowDocuments?: boolean
    publicShareShowExactAddress?: boolean
    publicShareExpiresAt?: string
    publicShareAdvisorName?: string
    publicShareAdvisorPhone?: string
    publicShareAdvisorWhatsapp?: string
    publicShareAdvisorEmail?: string
  }
  images: MediaOption[]
  documents: Array<MediaOption & { category: string }>
}

type Settings = {
  enabled: boolean
  showPrice: boolean
  showAdvisorContact: boolean
  showDocuments: boolean
  showExactAddress: boolean
  expiresAt: string
  advisorName: string
  advisorPhone: string
  advisorWhatsapp: string
  advisorEmail: string
  imageIds: string[]
  documentIds: string[]
}

function toDateTimeLocal(value?: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 16)
}

function toggle(items: string[], id: string) {
  return items.includes(id) ? items.filter(item => item !== id) : [...items, id]
}

export function PublicShareSettings({ canManage, property, images, documents }: Props) {
  const router = useRouter()
  const [settings, setSettings] = useState<Settings>({
    enabled: property.publicShareEnabled ?? false,
    showPrice: property.publicShareShowPrice ?? false,
    showAdvisorContact: property.publicShareShowAdvisorContact ?? false,
    showDocuments: property.publicShareShowDocuments ?? false,
    showExactAddress: property.publicShareShowExactAddress ?? false,
    expiresAt: toDateTimeLocal(property.publicShareExpiresAt),
    advisorName: property.publicShareAdvisorName ?? "",
    advisorPhone: property.publicShareAdvisorPhone ?? "",
    advisorWhatsapp: property.publicShareAdvisorWhatsapp ?? "",
    advisorEmail: property.publicShareAdvisorEmail ?? "",
    imageIds: images.filter(image => image.publicShareAllowed).map(image => image.id),
    documentIds: documents.filter(document => document.publicShareAllowed).map(document => document.id),
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState(
    property.publicShareEnabled && property.publicShareToken
      ? `/share/${property.publicShareToken}`
      : null,
  )

  const selectedDocumentCount = useMemo(
    () => settings.documentIds.length,
    [settings.documentIds],
  )

  const selectedImageCount = useMemo(
    () => settings.imageIds.length,
    [settings.imageIds],
  )

  function setBoolean(key: keyof Pick<Settings, "enabled" | "showPrice" | "showAdvisorContact" | "showDocuments" | "showExactAddress">, value: boolean) {
    setSettings(current => ({ ...current, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/properties/${property.id}/public-share`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...settings,
          expiresAt: settings.expiresAt ? new Date(settings.expiresAt).toISOString() : null,
          advisorName: settings.advisorName || null,
          advisorPhone: settings.advisorPhone || null,
          advisorWhatsapp: settings.advisorWhatsapp || null,
          advisorEmail: settings.advisorEmail || null,
        }),
      })
      const payload = await response.json().catch(() => null) as { error?: string; share?: { enabled: boolean; url: string } } | null
      if (!response.ok || !payload?.share) {
        throw new Error(payload?.error ?? "Could not save public share settings.")
      }

      setShareUrl(payload.share.enabled ? payload.share.url : null)
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save public share settings.")
    } finally {
      setSaving(false)
    }
  }

  async function copyShareUrl() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`)
  }

  return (
    <section className="rounded-3xl border bg-card p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Public share</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This is an opt-in, revocable public projection. It never gives visitors direct CRM access.
          </p>
        </div>
        {shareUrl && <Button type="button" variant="outline" onClick={copyShareUrl}>Copy public link</Button>}
      </div>

      {!canManage ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Public sharing settings can be managed only by authorized users.
        </p>
      ) : (
      <div className="mt-6 space-y-5">
        <label className="flex items-start gap-3 rounded-xl border p-4">
          <input type="checkbox" checked={settings.enabled} onChange={event => setBoolean("enabled", event.target.checked)} />
          <span><span className="font-medium">Enable public sharing</span><span className="mt-1 block text-sm text-muted-foreground">A random share token is created on first save. Disable it to revoke the page immediately.</span></span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.showPrice} onChange={event => setBoolean("showPrice", event.target.checked)} /> Show asking price or rent</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.showExactAddress} onChange={event => setBoolean("showExactAddress", event.target.checked)} /> Show exact address (otherwise locality only)</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.showAdvisorContact} onChange={event => setBoolean("showAdvisorContact", event.target.checked)} /> Show advisor contact entered below</label>
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.showDocuments} onChange={event => setBoolean("showDocuments", event.target.checked)} /> Show selected brochures and floor plans</label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Share expires at (optional)<input type="datetime-local" className="mt-1 block w-full rounded-md border p-2 font-normal" value={settings.expiresAt} onChange={event => setSettings(current => ({ ...current, expiresAt: event.target.value }))} /></label>
          <div className="text-sm text-muted-foreground">Leave expiry empty for a share that remains active until you disable it.</div>
        </div>

        {settings.showAdvisorContact && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">Advisor display name<input className="mt-1 block w-full rounded-md border p-2 font-normal" value={settings.advisorName} onChange={event => setSettings(current => ({ ...current, advisorName: event.target.value }))} /></label>
            <label className="text-sm font-medium">Public phone<input className="mt-1 block w-full rounded-md border p-2 font-normal" value={settings.advisorPhone} onChange={event => setSettings(current => ({ ...current, advisorPhone: event.target.value }))} /></label>
            <label className="text-sm font-medium">Public WhatsApp<input className="mt-1 block w-full rounded-md border p-2 font-normal" value={settings.advisorWhatsapp} onChange={event => setSettings(current => ({ ...current, advisorWhatsapp: event.target.value }))} /></label>
            <label className="text-sm font-medium">Public email<input type="email" className="mt-1 block w-full rounded-md border p-2 font-normal" value={settings.advisorEmail} onChange={event => setSettings(current => ({ ...current, advisorEmail: event.target.value }))} /></label>
          </div>
        )}

        <fieldset className="rounded-xl border p-4">
          <legend className="px-2 text-sm font-medium">Media included in this public share</legend>
          <p className="mb-3 text-sm text-muted-foreground">Only selected media is exposed. Images remain durable public media; documents get short-lived signed URLs.</p>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="outline" disabled={!images.length || saving} onClick={() => setSettings(current => ({ ...current, imageIds: images.map(image => image.id) }))}>Select all media</Button>
            <Button type="button" size="sm" variant="ghost" disabled={!selectedImageCount || saving} onClick={() => setSettings(current => ({ ...current, imageIds: [] }))}>Clear media</Button>
            <span className="text-xs text-muted-foreground">{selectedImageCount} of {images.length} media selected</span>
          </div>
          <div className="space-y-2">
            {images.map(image => <label key={image.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.imageIds.includes(image.id)} onChange={() => setSettings(current => ({ ...current, imageIds: toggle(current.imageIds, image.id) }))} /> {image.label}</label>)}
            {!images.length && <p className="text-sm text-muted-foreground">No property media is available to include.</p>}
          </div>
          <div className="mt-4 space-y-2 border-t pt-4">
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <Button type="button" size="sm" variant="outline" disabled={!documents.length || saving} onClick={() => setSettings(current => ({ ...current, documentIds: documents.map(document => document.id) }))}>Select all shareable documents</Button>
              <Button type="button" size="sm" variant="ghost" disabled={!selectedDocumentCount || saving} onClick={() => setSettings(current => ({ ...current, documentIds: [] }))}>Clear documents</Button>
              <span className="text-xs text-muted-foreground">{selectedDocumentCount} of {documents.length} shareable documents selected</span>
            </div>
            {documents.map(document => <label key={document.id} className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.documentIds.includes(document.id)} onChange={() => setSettings(current => ({ ...current, documentIds: toggle(current.documentIds, document.id) }))} /> {document.label} <span className="text-muted-foreground">({document.category.replaceAll("_", " ")})</span></label>)}
            {!documents.length && <p className="text-sm text-muted-foreground">Only brochure and floor-plan documents can be selected.</p>}
          </div>
        </fieldset>

        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="button" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save public share settings"}</Button>
      </div>
      )}
    </section>
  )
}
