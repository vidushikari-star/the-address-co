import type { ReelLogoPlacement, ReelLogoScale, ReelScene } from "@/lib/marketing/types"

/**
 * Conservative 1080×1920 creative safe areas. These are intentionally our
 * own editorial margins—not a claim about a platform's exact UI geometry.
 * They reserve room for mobile chrome and the right-side interaction rail.
 */
export const REEL_LAYOUT = Object.freeze({
  width: 1080,
  height: 1920,
  safe: Object.freeze({ top: 180, bottom: 300, left: 90, right: 270 }),
  overlay: Object.freeze({ maxWidth: 700, boxPadding: 22, lineSpacing: 12 }),
  logo: Object.freeze({ margin: 72, size: { small: 118, medium: 168, large: 220 } }),
})

type OverlayType = NonNullable<ReelScene["overlay"]>["type"]
type OverlayPosition = NonNullable<ReelScene["overlay"]>["position"]

type OverlayStyle = {
  maxLines: number
  maxCharsPerLine: number
  fontSize: number
  minFontSize: number
  x: number
  y: number
  align: "left" | "center"
  boxOpacity: number
}

function positionStyle(position: OverlayPosition | undefined, type: OverlayType): OverlayStyle {
  const left = REEL_LAYOUT.safe.left
  const rightSafeWidth = REEL_LAYOUT.width - REEL_LAYOUT.safe.left - REEL_LAYOUT.safe.right
  // Reserve room for a three-line boxed treatment plus its shadow/padding.
  const lowerY = REEL_LAYOUT.height - REEL_LAYOUT.safe.bottom - 320
  const base: OverlayStyle = {
    maxLines: 3,
    maxCharsPerLine: 26,
    fontSize: 54,
    minFontSize: 40,
    x: left,
    y: lowerY,
    align: "left",
    boxOpacity: 0.5,
  }

  if (type === "hook") return { ...base, maxLines: 2, maxCharsPerLine: 23, fontSize: 66, minFontSize: 48, y: REEL_LAYOUT.safe.top + 36, boxOpacity: 0.38 }
  if (type === "end_card") return { ...base, maxLines: 3, maxCharsPerLine: 24, fontSize: 62, minFontSize: 44, x: Math.round((REEL_LAYOUT.width - rightSafeWidth) / 2), y: 760, align: "center", boxOpacity: 0.58 }
  if (type === "price") return { ...base, maxLines: 2, maxCharsPerLine: 22, fontSize: 58, minFontSize: 44, boxOpacity: 0.6 }
  if (type === "property_label") return { ...base, maxLines: 2, maxCharsPerLine: 30, fontSize: 44, minFontSize: 36, y: REEL_LAYOUT.safe.top + 28, boxOpacity: 0.42 }
  if (type === "cta") return { ...base, maxLines: 2, maxCharsPerLine: 28, fontSize: 48, minFontSize: 38, boxOpacity: 0.55 }

  switch (position) {
    case "top":
    case "top_left": return { ...base, y: REEL_LAYOUT.safe.top + 30 }
    case "top_right": return { ...base, x: REEL_LAYOUT.width - REEL_LAYOUT.safe.right - rightSafeWidth, y: REEL_LAYOUT.safe.top + 30 }
    case "center": return { ...base, x: Math.round((REEL_LAYOUT.width - rightSafeWidth) / 2), y: 820, align: "center" }
    case "bottom":
    case "lower_right": return { ...base, x: REEL_LAYOUT.width - REEL_LAYOUT.safe.right - rightSafeWidth, y: lowerY }
    case "lower_left":
    default: return base
  }
}

function wrapWords(text: string, maxChars: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars || !current) {
      current = next
      continue
    }
    lines.push(current)
    current = word
    if (lines.length === maxLines) break
  }
  if (current && lines.length < maxLines) lines.push(current)
  const usedWords = lines.join(" ").split(" ").length
  const truncated = usedWords < words.length
  if (truncated && lines.length) lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, Math.max(1, maxChars - 1)).trimEnd()}…`
  return lines
}

/** Returns a bounded, mobile-legible drawtext plan. Text is reflowed before shrinking. */
export function layoutReelOverlay(input: { text?: string; position?: OverlayPosition; type?: OverlayType }) {
  if (!input.text?.trim()) return null
  const style = positionStyle(input.position, input.type)
  const lines = wrapWords(input.text, style.maxCharsPerLine, style.maxLines)
  const longest = Math.max(...lines.map(line => line.length), 1)
  const fontSize = Math.max(style.minFontSize, Math.min(style.fontSize, Math.floor((REEL_LAYOUT.overlay.maxWidth / longest) * 1.72)))
  return {
    text: lines.join("\n"),
    fontSize,
    lineSpacing: REEL_LAYOUT.overlay.lineSpacing,
    boxPadding: REEL_LAYOUT.overlay.boxPadding,
    x: style.x,
    y: style.y,
    alignment: style.align,
    boxOpacity: style.boxOpacity,
  }
}

export function logoLayout(placement: ReelLogoPlacement, scale: ReelLogoScale, margin: number = REEL_LAYOUT.logo.margin) {
  const size = REEL_LAYOUT.logo.size[scale]
  const left = Math.max(REEL_LAYOUT.safe.left, margin)
  const top = Math.max(REEL_LAYOUT.safe.top, margin)
  const right = REEL_LAYOUT.width - REEL_LAYOUT.safe.right - size
  const bottom = REEL_LAYOUT.height - REEL_LAYOUT.safe.bottom - size
  switch (placement) {
    case "top_left": return { size, x: left, y: top }
    case "top_right": return { size, x: right, y: top }
    case "bottom_left": return { size, x: left, y: bottom }
    case "bottom_right": return { size, x: right, y: bottom }
    case "end_card_only": return { size, x: Math.round((REEL_LAYOUT.width - size) / 2), y: 550 }
    default: return null
  }
}
