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

export type ReelOverlayInput = {
  text?: string
  position?: OverlayPosition
  type?: OverlayType
}

export type ReelOverlayLayout = {
  /** Logical visual lines. Use this exact result in the CRM preview and renderer. */
  lines: string[]
  /** Convenience form for `<pre>`/`white-space: pre-line` consumers and textfile output. */
  text: string
  fontSize: number
  lineSpacing: number
  boxPadding: number
  x: number
  y: number
  alignment: "left" | "center"
  boxOpacity: number
  status: "ok" | "font_reduced" | "shortened"
}

type OverlayStyle = {
  maxLines: number
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
    fontSize: 54,
    minFontSize: 40,
    x: left,
    y: lowerY,
    align: "left",
    boxOpacity: 0.5,
  }

  if (type === "hook") return { ...base, maxLines: 2, fontSize: 66, minFontSize: 48, y: REEL_LAYOUT.safe.top + 36, boxOpacity: 0.38 }
  if (type === "end_card") return { ...base, maxLines: 3, fontSize: 62, minFontSize: 44, x: Math.round((REEL_LAYOUT.width - rightSafeWidth) / 2), y: 760, align: "center", boxOpacity: 0.58 }
  if (type === "price") return { ...base, maxLines: 2, fontSize: 58, minFontSize: 44, boxOpacity: 0.6 }
  if (type === "property_label") return { ...base, maxLines: 2, fontSize: 44, minFontSize: 36, y: REEL_LAYOUT.safe.top + 28, boxOpacity: 0.42 }
  if (type === "cta") return { ...base, maxLines: 2, fontSize: 48, minFontSize: 38, boxOpacity: 0.55 }

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

/**
 * Makes the AI/user text safe to lay out without changing its words or
 * punctuation. In this controlled overlay format `\\n` is an intentional
 * logical line-break marker; no literal escape sequence reaches FFmpeg.
 */
export function normalizeReelOverlayText(value: string) {
  const source = value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/\\+n/g, "\n")

  const rawLines = source.split("\n").map(line => line
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/\s*•\s*/g, " • ")
    .trim()
  ).filter(Boolean)

  // A break directly next to a bullet is a formatting accident, not a useful
  // visual line. Join it before the bullet-aware wrapper chooses a safe break.
  const lines: string[] = []
  for (const line of rawLines) {
    if (lines.length && lines[lines.length - 1].endsWith(" •")) {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${line.replace(/^•\s*/, "")}`.trim()
    } else if (lines.length && line.startsWith("• ")) {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${line}`.trim()
    } else {
      lines.push(line)
    }
  }
  return lines.join("\n")
}

function glyphWidthFactor(character: string) {
  if (character === " ") return 0.28
  if (character === "•") return 0.42
  if (/[ilI.,'`!:;|]/.test(character)) return 0.3
  if (/[MW@#%&]/.test(character)) return 0.82
  if (/[A-Z]/.test(character)) return 0.66
  if (/[\u2E80-\u9FFF\uAC00-\uD7AF]/.test(character)) return 0.94
  if (/[-–—/()]/.test(character)) return 0.42
  return 0.56
}

/** A deterministic width estimate keeps server render and UI preview in agreement. */
function estimatedLineWidth(line: string, fontSize: number) {
  return [...line].reduce((width, character) => width + glyphWidthFactor(character) * fontSize, 0)
}

function fitsWidth(line: string, maximumWidth: number, fontSize: number) {
  return estimatedLineWidth(line, fontSize) <= maximumWidth
}

function wrapWordsInPhrase(phrase: string, maximumWidth: number, fontSize: number) {
  const words = phrase.split(" ").filter(Boolean)
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (!current || fitsWidth(candidate, maximumWidth, fontSize)) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Bullet phrases are units. A bullet remains only when its two phrases share
 * a line; it never ends a line or becomes attached to the next word.
 */
function wrapParagraph(paragraph: string, maximumWidth: number, fontSize: number) {
  const phrases = paragraph.split(/\s*•\s*/).map(part => part.trim()).filter(Boolean)
  if (!phrases.length) return []

  const lines: string[] = []
  let current = ""
  for (const phrase of phrases) {
    const phraseLines = wrapWordsInPhrase(phrase, maximumWidth, fontSize)
    const [first, ...rest] = phraseLines
    if (!first) continue
    const candidate = current ? `${current} • ${first}` : first
    if (!current || fitsWidth(candidate, maximumWidth, fontSize)) {
      current = candidate
    } else {
      lines.push(current)
      current = first
    }
    for (const continuation of rest) {
      lines.push(current)
      current = continuation
    }
  }
  if (current) lines.push(current)
  return lines
}

function wrapLogicalLines(text: string, maximumWidth: number, fontSize: number) {
  return text.split("\n").flatMap(line => wrapParagraph(line, maximumWidth, fontSize))
}

function ellipsizeLine(line: string, maximumWidth: number, fontSize: number) {
  const words = line.split(" ").filter(Boolean)
  while (words.length && !fitsWidth(`${words.join(" ")}…`, maximumWidth, fontSize)) words.pop()
  return words.length ? `${words.join(" ")}…` : "…"
}

function shortenedLines(lines: string[], maxLines: number, maximumWidth: number, fontSize: number) {
  const kept = lines.slice(0, maxLines)
  if (!kept.length) return kept
  kept[kept.length - 1] = ellipsizeLine(kept[kept.length - 1], maximumWidth, fontSize)
  return kept
}

/** Returns a bounded, mobile-legible, word-aware text plan. */
export function layoutReelOverlay(input: ReelOverlayInput): ReelOverlayLayout | null {
  if (!input.text?.trim()) return null
  const text = normalizeReelOverlayText(input.text)
  if (!text) return null

  const style = positionStyle(input.position, input.type)
  const maximumWidth = REEL_LAYOUT.overlay.maxWidth - REEL_LAYOUT.overlay.boxPadding * 2
  let fontSize = style.fontSize
  let lines = wrapLogicalLines(text, maximumWidth, fontSize)
  while (lines.length > style.maxLines && fontSize > style.minFontSize) {
    fontSize = Math.max(style.minFontSize, fontSize - 2)
    lines = wrapLogicalLines(text, maximumWidth, fontSize)
  }
  const status = lines.length > style.maxLines
    ? "shortened"
    : fontSize < style.fontSize
      ? "font_reduced"
      : "ok"
  if (lines.length > style.maxLines) lines = shortenedLines(lines, style.maxLines, maximumWidth, fontSize)

  return {
    lines,
    text: lines.join("\n"),
    fontSize,
    lineSpacing: REEL_LAYOUT.overlay.lineSpacing,
    boxPadding: REEL_LAYOUT.overlay.boxPadding,
    x: style.x,
    y: style.y,
    alignment: style.align,
    boxOpacity: style.boxOpacity,
    status,
  }
}

/** The CRM storyboard preview uses the exact same normalized line plan as FFmpeg. */
export function reelOverlayPreviewText(input: ReelOverlayInput) {
  return layoutReelOverlay(input)?.text ?? "No overlay text"
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
