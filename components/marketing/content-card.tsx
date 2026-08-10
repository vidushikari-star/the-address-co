"use client"

import Link from "next/link"
import { ArrowUpRight, ImageIcon, Play } from "lucide-react"

import { MarketingStatusPill } from "@/components/marketing/status-pill"
import { Checkbox } from "@/components/ui/checkbox"
import { CONTENT_TYPE_LABELS, type MarketingContent } from "@/lib/marketing/types"

type SelectionControl = {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
}

export function MarketingContentCard({ content, selection }: { content: MarketingContent; selection?: SelectionControl }) {
  const preview = content.renderedUrl ?? content.coverUrl
  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] bg-muted">
        {preview ? (
          content.contentType === "reel" && content.renderedUrl ? (
            <video className="h-full w-full object-cover" muted playsInline preload="metadata" src={content.renderedUrl} />
          ) : (
            // Property source images are already public CRM media; rendered previews use signed URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          )
        ) : <ImageIcon className="absolute inset-0 m-auto h-8 w-8 text-muted-foreground" />}
        {selection && <div className="absolute left-3 top-3 rounded-md bg-background/90 p-1 shadow-sm"><Checkbox checked={selection.checked} disabled={selection.disabled} aria-label={selection.disabled ? "Only draft content can be selected for deletion" : `Select ${content.title || "marketing draft"}`} onCheckedChange={checked => selection.onCheckedChange(Boolean(checked))} /></div>}
        {content.contentType === "reel" && <span className={`absolute top-3 rounded-full bg-black/65 p-2 text-white ${selection ? "left-12" : "left-3"}`}><Play className="h-3.5 w-3.5 fill-current" /></span>}
        <div className="absolute right-3 top-3"><MarketingStatusPill status={content.status} /></div>
      </div>
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{CONTENT_TYPE_LABELS[content.contentType]}</p>
          <h2 className="line-clamp-1 font-semibold">{content.title || content.propertyName || "Untitled content"}</h2>
          <p className="line-clamp-1 text-sm text-muted-foreground">{content.propertyLocation || "Property details retained in snapshot"}</p>
        </div>
        {content.caption && <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">{content.caption}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(content.proposedPublishAt || content.createdAt))}</span>
          <Link href={`/marketing/content?selected=${content.id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Open <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </article>
  )
}
