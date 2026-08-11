"use client"

/* eslint-disable @next/next/no-img-element */

import { ChevronLeft, ChevronRight, Images } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import type { MarketingAsset } from "@/lib/marketing/types"

export function CarouselMediaPreview({ assets }: { assets: MarketingAsset[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const count = assets.length
  const current = assets[Math.min(currentIndex, Math.max(0, count - 1))]

  useEffect(() => {
    setCurrentIndex(index => Math.min(index, Math.max(0, count - 1)))
  }, [count])

  if (!current) {
    return <div className="grid aspect-[4/3] place-items-center rounded-lg border border-dashed bg-muted/40 p-6 text-center text-xs text-muted-foreground">No selected Carousel media is available.</div>
  }

  function previous() {
    setCurrentIndex(index => (index - 1 + count) % count)
  }

  function next() {
    setCurrentIndex(index => (index + 1) % count)
  }

  const cover = current.metadata.isCover === true
  return <section className="space-y-3 rounded-lg bg-card p-1">
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
      <div><p className="text-xs font-semibold text-muted-foreground">Original CRM media — {count} {count === 1 ? "item" : "items"}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{currentIndex + 1} / {count}{cover ? " · Property cover" : ""}</p></div>
      <Images className="h-4 w-4 text-primary" aria-hidden="true" />
    </div>
    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
      {current.mediaType === "video"
        ? <video className="h-full w-full object-cover" controls preload="metadata" src={current.sourceUrl ?? current.signedUrl ?? ""} />
        : <img className="h-full w-full object-cover" src={current.sourceUrl ?? current.signedUrl ?? ""} alt={`Selected Carousel media ${currentIndex + 1} of ${count}`} />}
      {count > 1 && <>
        <Button type="button" size="icon-sm" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2 shadow" onClick={previous} aria-label="Previous Carousel image"><ChevronLeft className="h-4 w-4" /></Button>
        <Button type="button" size="icon-sm" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 shadow" onClick={next} aria-label="Next Carousel image"><ChevronRight className="h-4 w-4" /></Button>
      </>}
    </div>
    {count > 1 && <div className="flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Carousel media thumbnails">
      {assets.map((asset, index) => <button key={asset.id} type="button" onClick={() => setCurrentIndex(index)} className={`relative h-14 w-16 shrink-0 overflow-hidden rounded-md border-2 ${index === currentIndex ? "border-primary" : "border-transparent"}`} aria-label={`View Carousel image ${index + 1}${asset.metadata.isCover === true ? ", property cover" : ""}`} aria-pressed={index === currentIndex}>
        {asset.mediaType === "video"
          ? <video className="h-full w-full object-cover" muted playsInline preload="metadata" src={asset.sourceUrl ?? asset.signedUrl ?? ""} />
          : <img className="h-full w-full object-cover" src={asset.sourceUrl ?? asset.signedUrl ?? ""} alt="" />}
        {asset.metadata.isCover === true && <span className="absolute bottom-0 left-0 right-0 bg-black/65 px-1 py-0.5 text-[9px] font-medium text-white">Cover</span>}
      </button>)}
    </div>}
  </section>
}
