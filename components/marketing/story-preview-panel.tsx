"use client"
/* eslint-disable @next/next/no-img-element */

import { useState } from "react"
import { StoryCompositionSchema } from "@/lib/marketing/schemas"
import { STORY_LAYOUT, layoutStoryCopy } from "@/lib/marketing/story-layout"
import type { MarketingContent } from "@/lib/marketing/types"

/** The review frame is intentionally only a rendered Story derivative—not raw CRM media plus detached copy. */
export function StoryPreviewPanel({ content }: { content: MarketingContent }) {
  const [showSafeZones, setShowSafeZones] = useState(false)
  const composition = StoryCompositionSchema.safeParse(content.composition)
  const plans = composition.success ? layoutStoryCopy(composition.data.storyCopy, composition.data.layoutStyle) : []
  return <section className="space-y-2">
    <div className="flex items-center justify-between"><p className="text-xs font-semibold text-muted-foreground">Instagram Story · 1080 × 1920</p><p className="text-[11px] text-muted-foreground">9:16 final creative</p></div>
    <div className="relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-xl bg-zinc-900 shadow-sm">
      {content.renderedUrl
        ? <img className="absolute inset-0 h-full w-full object-cover" src={content.renderedUrl} alt="Rendered Instagram Story" />
        : content.status === "failed"
          ? <div className="flex h-full items-center justify-center p-8 text-center text-sm text-zinc-300">Story rendering failed. Edit or regenerate the visual copy, then retry rendering. A raw CRM source image is never used as the final Story preview.</div>
          : <div className="flex h-full items-center justify-center p-8 text-center text-sm text-zinc-300">Story creative is rendering. A raw CRM source image is never used as the final Story preview.</div>}
      {showSafeZones && <div aria-hidden className="pointer-events-none absolute border border-dashed border-white/45" style={{ top: `${STORY_LAYOUT.safe.top / STORY_LAYOUT.height * 100}%`, bottom: `${STORY_LAYOUT.safe.bottom / STORY_LAYOUT.height * 100}%`, left: `${STORY_LAYOUT.safe.left / STORY_LAYOUT.width * 100}%`, right: `${STORY_LAYOUT.safe.right / STORY_LAYOUT.width * 100}%` }} />}
      {plans.map(plan => <span key={plan.role} className="sr-only">{plan.role}: {plan.text}</span>)}
    </div>
    <label className="flex items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={showSafeZones} onChange={event => setShowSafeZones(event.target.checked)} />Show editing safe-zone guide</label>
  </section>
}
