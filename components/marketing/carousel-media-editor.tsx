"use client"

/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Star } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type GalleryImage = { id: string; url: string; isCover: boolean }

type Props = {
  contentId: string
  status: string
  gallery: GalleryImage[]
  selectedPropertyImageIds: string[]
}

/**
 * Edits only the ordered Marketing reference set. Property images are never
 * uploaded, deleted, or reordered from this control.
 */
export function CarouselMediaEditor({ contentId, status, gallery, selectedPropertyImageIds }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(selectedPropertyImageIds)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const galleryById = useMemo(() => new Map(gallery.map(image => [image.id, image])), [gallery])

  useEffect(() => {
    setSelected(selectedPropertyImageIds)
  }, [selectedPropertyImageIds])

  function close(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen && !isPending) {
      setSelected(selectedPropertyImageIds)
      setMessage(null)
    }
  }

  function toggle(imageId: string) {
    setMessage(null)
    setSelected(current => {
      if (current.includes(imageId)) return current.filter(id => id !== imageId)
      if (current.length >= 10) {
        setMessage("A Carousel can contain at most 10 images.")
        return current
      }
      return [...current, imageId]
    })
  }

  function move(imageId: string, direction: -1 | 1) {
    setSelected(current => {
      const index = current.indexOf(imageId)
      const destination = index + direction
      if (index < 0 || destination < 0 || destination >= current.length) return current
      const next = [...current]
      ;[next[index], next[destination]] = [next[destination], next[index]]
      return next
    })
  }

  function save() {
    if (selected.length < 2 || selected.length > 10) {
      setMessage("Choose between 2 and 10 images before saving.")
      return
    }
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${contentId}/carousel-media`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyImageIds: selected }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) {
        setMessage(data.error ?? "Carousel media could not be saved.")
        return
      }
      setOpen(false)
      setMessage(null)
      router.refresh()
    })
  }

  return <section className="rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold">Carousel media</p>
        <p className="mt-1 text-xs text-muted-foreground">{selectedPropertyImageIds.length} selected · the first image is the Instagram cover.</p>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}><ImagePlus className="h-4 w-4" />Edit Carousel Media</Button>
    </div>
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto" showCloseButton={!isPending}>
        <DialogHeader>
          <DialogTitle>Change Carousel images</DialogTitle>
          <DialogDescription>Select 2–10 images from this property’s CRM gallery. Saving changes only this Marketing Carousel and resets it to Draft for review{status === "approved" ? "; the prior approval will not be reused" : ""}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2"><p className="text-sm font-medium">Selected order</p><p className="text-xs text-muted-foreground">{selected.length} / 10 · first is cover</p></div>
            {selected.length ? <ol className="grid gap-2 sm:grid-cols-2">
              {selected.map((imageId, index) => {
                const image = galleryById.get(imageId)
                if (!image) return null
                return <li key={image.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2">
                  <img className="h-14 w-16 rounded object-cover" src={image.url} alt="" />
                  <div className="min-w-0 flex-1"><p className="text-xs font-semibold">{index === 0 ? "Cover" : `Image ${index + 1}`}</p>{image.isCover && <p className="mt-0.5 text-[11px] text-muted-foreground">Property cover</p>}</div>
                  <div className="flex gap-1"><Button type="button" size="icon-sm" variant="ghost" onClick={() => move(image.id, -1)} disabled={isPending || index === 0} aria-label={`Move image ${index + 1} left`}><ChevronLeft className="h-4 w-4" /></Button><Button type="button" size="icon-sm" variant="ghost" onClick={() => move(image.id, 1)} disabled={isPending || index === selected.length - 1} aria-label={`Move image ${index + 1} right`}><ChevronRight className="h-4 w-4" /></Button></div>
                </li>
              })}
            </ol> : <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Choose at least two property images below.</p>}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Property gallery</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {gallery.map(image => {
                const selectedIndex = selected.indexOf(image.id)
                const isSelected = selectedIndex >= 0
                return <button key={image.id} type="button" onClick={() => toggle(image.id)} disabled={isPending} aria-pressed={isSelected} className={`relative overflow-hidden rounded-lg border-2 text-left transition ${isSelected ? "border-primary" : "border-transparent hover:border-muted-foreground/40"}`}>
                  <img className="aspect-[4/3] w-full object-cover" src={image.url} alt={`Property gallery image${image.isCover ? ", property cover" : ""}`} />
                  <span className={`absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${isSelected ? "bg-primary text-primary-foreground" : "bg-black/60 text-white"}`}>{isSelected ? selectedIndex + 1 : "+"}</span>
                  {image.isCover && <span className="absolute bottom-1 left-1 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white"><Star className="h-3 w-3" />Property cover</span>}
                </button>
              })}
            </div>
            {!gallery.length && <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">This property has no CRM gallery images available for a Carousel.</p>}
          </div>
          {message && <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground" role="status">{message}</p>}
        </div>
        <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => close(false)} disabled={isPending}>Cancel</Button><Button type="button" onClick={save} disabled={isPending || selected.length < 2 || selected.length > 10}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save Carousel Media</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
}
