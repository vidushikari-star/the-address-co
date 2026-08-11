/* eslint-disable @next/next/no-img-element */
"use client"

import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { MarketingBrandAsset } from "@/lib/marketing/types"

export function MarketingBrandAssets({ logo }: { logo: MarketingBrandAsset | null }) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function upload() {
    if (!file) return
    setMessage(null)
    startTransition(async () => {
      const data = new FormData()
      data.set("file", file)
      const response = await fetch("/api/marketing/brand-assets/logo", { method: "POST", body: data })
      const result = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) return setMessage(result.error ?? "Could not upload the brand logo.")
      setFile(null)
      if (fileInput.current) fileInput.current.value = ""
      router.refresh()
    })
  }

  function remove() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch("/api/marketing/brand-assets/logo", { method: "DELETE" })
      const result = await response.json().catch(() => ({})) as { error?: string }
      setConfirmOpen(false)
      if (!response.ok) return setMessage(result.error ?? "Could not remove the active logo.")
      router.refresh()
    })
  }

  return <section className="rounded-2xl border bg-card p-5 sm:p-6">
    <div><h2 className="font-semibold">Brand Assets</h2><p className="mt-1 text-sm text-muted-foreground">Your private logo stays separate from property source media and can be used only on new Marketing derivatives.</p></div>
    <div className="mt-5 flex flex-wrap items-center gap-4 rounded-xl border bg-muted/30 p-4">
      {logo?.signedUrl ? <img src={logo.signedUrl} alt="Active brand logo" className="h-16 w-32 rounded-md object-contain bg-background p-2" /> : <div className="flex h-16 w-32 items-center justify-center rounded-md border border-dashed bg-background text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>}
      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{logo ? logo.filename : "No brand logo uploaded"}</p><p className="mt-1 text-xs text-muted-foreground">{logo ? `${logo.mimeType.replace("image/", "").toUpperCase()} · Private · Active` : "Transparent PNG or WebP is recommended. SVG is unavailable because the render pipeline does not safely rasterise uploads."}</p></div>
      {logo && <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmOpen(true)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" />Remove</Button>}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><input ref={fileInput} type="file" accept=".png,.webp,image/png,image/webp" className="max-w-xs text-sm" onChange={event => setFile(event.target.files?.[0] ?? null)} /><Button type="button" size="sm" onClick={upload} disabled={!file || isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{logo ? "Replace logo" : "Upload logo"}</Button></div>
    {message && <p className="mt-3 text-sm text-red-700" role="status">{message}</p>}
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Remove active brand logo?" description="Existing rendered Reels remain unchanged. New renders will not use this logo unless another one is uploaded." confirmLabel="Remove logo" onConfirm={remove} loading={isPending} />
  </section>
}
