import {
  reelTypographyFontFile,
} from "@/lib/marketing/reel-typography"

import type {
  ReelTypographyStyle,
  StoryComposition,
  StoryCopy,
  StoryLayoutStyle,
} from "@/lib/marketing/types"

/** Conservative editorial areas inside a 1080×1920 Story canvas. */
export const STORY_LAYOUT = Object.freeze({
  width: 1080,
  height: 1920,
  safe: Object.freeze({
    top: 210,
    bottom: 300,
    left: 84,
    right: 84,
  }),
  logo: Object.freeze({
    margin: 84,
    size: Object.freeze({ small: 108, medium: 150, large: 196 }),
  }),
})

/**
 * These are deliberately stricter than the permissive persistence schema.
 * They describe the normal (not emergency compact) visual target sent to AI
 * and shown to an editor. Legacy content is still parsed and compacted safely.
 */
export const STORY_COPY_GUIDANCE = Object.freeze({
  headline: Object.freeze({ maximumLines: 2, recommendedCharacters: 42 }),
  supportingLine: Object.freeze({ maximumLines: 3, recommendedCharacters: 108 }),
  highlights: Object.freeze({ maximumItems: 3, maximumLines: 3, recommendedCharactersPerItem: 32 }),
  priceLine: Object.freeze({ maximumLines: 2, recommendedCharacters: 60 }),
  cta: Object.freeze({ maximumLines: 2, recommendedCharacters: 56 }),
})

export type StoryTextRole =
  | "headline"
  | "supporting_line"
  | "highlights"
  | "price"
  | "cta"

export type StoryTextLayout = {
  role: StoryTextRole
  text: string
  lines: string[]
  x: number
  y: number
  fontSize: number
  lineSpacing: number
  boxOpacity: number
  alignment: "left" | "center"
  fits: boolean
  /** The maximum text width used when breaking lines for drawtext. */
  maximumWidth: number
}

type StoryTextStyle = {
  y: number
  fontSize: number
  minimumFontSize: number
  lineSpacing: number
  minimumLineSpacing: number
  maximumLines: number
  maximumHeight: number
  /** Kept as a conservative editorial measure, not a raw slice limit. */
  maximumCharactersPerLine: number
  boxOpacity: number
  alignment: "left" | "center"
}

function styleFor(role: StoryTextRole): StoryTextStyle {
  switch (role) {
    case "headline":
      return { y: 290, fontSize: 76, minimumFontSize: 62, lineSpacing: 16, minimumLineSpacing: 8, maximumLines: 2, maximumHeight: 180, maximumCharactersPerLine: 21, boxOpacity: 0.42, alignment: "left" }
    case "supporting_line":
      return { y: 560, fontSize: 42, minimumFontSize: 34, lineSpacing: 11, minimumLineSpacing: 5, maximumLines: 3, maximumHeight: 154, maximumCharactersPerLine: 38, boxOpacity: 0.34, alignment: "left" }
    case "highlights":
      return { y: 850, fontSize: 40, minimumFontSize: 32, lineSpacing: 10, minimumLineSpacing: 4, maximumLines: 3, maximumHeight: 136, maximumCharactersPerLine: 36, boxOpacity: 0.4, alignment: "left" }
    case "price":
      return { y: 1270, fontSize: 50, minimumFontSize: 42, lineSpacing: 12, minimumLineSpacing: 6, maximumLines: 2, maximumHeight: 114, maximumCharactersPerLine: 30, boxOpacity: 0.55, alignment: "left" }
    case "cta":
      return { y: 1460, fontSize: 44, minimumFontSize: 38, lineSpacing: 10, minimumLineSpacing: 5, maximumLines: 2, maximumHeight: 104, maximumCharactersPerLine: 34, boxOpacity: 0.58, alignment: "left" }
  }
}

function normalize(value: string) {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\f\v ]+/g, " ")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n")
}

/**
 * FFmpeg's drawtext does not expose a portable server-side text-measurement
 * API. This conservative glyph model is therefore the single measurement
 * contract for line breaking, preview semantics, validation, and drawtext
 * input. Wide glyphs consume more room than narrow glyphs, unlike the former
 * raw character-count gate.
 */
function glyphWidth(character: string, fontSize: number) {
  if (/\s/u.test(character)) return fontSize * 0.28
  if (/[ilIjt'`.,:;!|]/u.test(character)) return fontSize * 0.31
  if (/[mwMW@#%&]/u.test(character)) return fontSize * 0.82
  if (/[A-Z0-9₹]/u.test(character)) return fontSize * 0.66
  return fontSize * 0.52
}

function measuredWidth(value: string, fontSize: number) {
  return [...value].reduce((width, character) => width + glyphWidth(character, fontSize), 0)
}

function maximumWidth(style: StoryTextStyle) {
  // Preserve room for drawtext's panel border on both sides while retaining
  // the existing conservative editorial line measures.
  return Math.min(
    STORY_LAYOUT.width - STORY_LAYOUT.safe.left - STORY_LAYOUT.safe.right - 44,
    style.maximumCharactersPerLine * style.fontSize * 0.5,
  )
}

function truncateToWidth(value: string, width: number, fontSize: number) {
  const normalized = normalize(value)
  if (measuredWidth(normalized, fontSize) <= width) return normalized
  const ellipsis = "…"
  let result = ""
  for (const character of normalized) {
    if (measuredWidth(`${result}${character}${ellipsis}`, fontSize) > width) break
    result += character
  }
  return result.trimEnd() ? `${result.trimEnd()}${ellipsis}` : ellipsis
}

function wrap(value: string, width: number, fontSize: number) {
  const lines: string[] = []

  for (const paragraph of normalize(value).split("\n")) {
    let line = ""
    for (const rawWord of paragraph.split(" ")) {
      const word = measuredWidth(rawWord, fontSize) > width
        ? truncateToWidth(rawWord, width, fontSize)
        : rawWord
      const next = line ? `${line} ${word}` : word
      if (!line || measuredWidth(next, fontSize) <= width) {
        line = next
        continue
      }

      lines.push(line)
      line = word
    }
    if (line) lines.push(line)
  }

  return lines
}

function textHeight(lines: string[], fontSize: number, lineSpacing: number) {
  return lines.length * fontSize + Math.max(0, lines.length - 1) * lineSpacing
}

function plan(
  role: StoryTextRole,
  value: string,
  fontSize = styleFor(role).fontSize,
  lineSpacing = styleFor(role).lineSpacing,
): StoryTextLayout | null {
  const text = normalize(value)
  if (!text) return null

  const style = styleFor(role)
  const width = maximumWidth(style)
  const lines = wrap(text, width, fontSize)

  return {
    role,
    text: lines.join("\n"),
    lines,
    x: STORY_LAYOUT.safe.left,
    y: style.y,
    fontSize,
    lineSpacing,
    boxOpacity: style.boxOpacity,
    alignment: style.alignment,
    maximumWidth: width,
    fits: lines.length <= style.maximumLines && textHeight(lines, fontSize, lineSpacing) <= style.maximumHeight,
  }
}

/** Applies normal typography, then minimum type and line spacing before copy is shortened. */
function fittedPlan(role: StoryTextRole, value: string) {
  const style = styleFor(role)
  let candidate = plan(role, value)
  if (!candidate || candidate.fits) return candidate

  for (let fontSize = style.fontSize - 2; fontSize >= style.minimumFontSize; fontSize -= 2) {
    candidate = plan(role, value, fontSize, style.lineSpacing)
    if (candidate?.fits) return candidate
  }

  for (let lineSpacing = style.lineSpacing - 1; lineSpacing >= style.minimumLineSpacing; lineSpacing -= 1) {
    candidate = plan(role, value, style.minimumFontSize, lineSpacing)
    if (candidate?.fits) return candidate
  }

  return candidate
}

function highlightedText(highlights: string[]) {
  return highlights
    .map(item => normalize(item))
    .filter(Boolean)
    .map(item => `• ${item}`)
    .join("\n")
}

function rawStoryPlans(copy: StoryCopy) {
  return [
    plan("headline", copy.headline),
    plan("supporting_line", copy.supportingLine),
    plan("highlights", highlightedText(copy.highlights)),
    plan("price", copy.priceLine),
    plan("cta", copy.cta),
  ].filter((item): item is StoryTextLayout => Boolean(item))
}

function plannedStoryCopy(copy: StoryCopy) {
  return [
    fittedPlan("headline", copy.headline),
    fittedPlan("supporting_line", copy.supportingLine),
    fittedPlan("highlights", highlightedText(copy.highlights)),
    fittedPlan("price", copy.priceLine),
    fittedPlan("cta", copy.cta),
  ].filter((item): item is StoryTextLayout => Boolean(item))
}

function shortenForRole(role: StoryTextRole, value: string) {
  const original = normalize(value)
  if (!original) return ""
  const rendered = fittedPlan(role, original)
  if (rendered?.fits && rendered.text.replaceAll("\n", " ") === original.replaceAll("\n", " ")) return original
  if (rendered?.fits) return rendered.text

  const words = original.replace(/\n/g, " ").split(" ").filter(Boolean)
  let result = ""
  for (const word of words) {
    const next = result ? `${result} ${word}` : word
    if (fittedPlan(role, next)?.fits) {
      result = next
      continue
    }
    break
  }

  const style = styleFor(role)
  const safeWord = result || truncateToWidth(words[0] ?? original, maximumWidth(style), style.minimumFontSize)
  const ellipsized = `${safeWord.replace(/…+$/u, "").trimEnd()}…`
  return fittedPlan(role, ellipsized)?.fits ? ellipsized : safeWord
}

function shortenHighlights(highlights: string[]) {
  const style = styleFor("highlights")
  const bulletWidth = measuredWidth("• ", style.minimumFontSize)
  const availableWidth = maximumWidth(style) - bulletWidth
  return highlights
    .map(item => truncateToWidth(item, availableWidth, style.minimumFontSize))
    .slice(0, STORY_COPY_GUIDANCE.highlights.maximumItems)
}

function normalizedCopy(copy: StoryCopy): StoryCopy {
  return {
    headline: normalize(copy.headline),
    supportingLine: normalize(copy.supportingLine),
    highlights: copy.highlights.map(item => normalize(item)).filter(Boolean).slice(0, STORY_COPY_GUIDANCE.highlights.maximumItems),
    priceLine: normalize(copy.priceLine),
    cta: normalize(copy.cta),
  }
}

export type StoryCopyFit = {
  storyCopy: StoryCopy
  plans: StoryTextLayout[]
  fits: boolean
  adjusted: boolean
  /** The initial normal-size plan violated the AI/editor visual target. */
  requiresAiCondensation: boolean
  truncatedHighlights: boolean
}

/**
 * Deterministically makes a valid Story safe before a job is queued. The
 * order is intentional: normal layout and wrapping, type reduction, line
 * spacing reduction, then compact/truncated highlights and last-resort text
 * shortening. The renderer consumes the returned plan verbatim.
 */
export function fitStoryCopy(copy: StoryCopy): StoryCopyFit {
  const original = normalizedCopy(copy)
  const rawPlans = rawStoryPlans(original)
  const requiresAiCondensation = rawPlans.some(item => !item.fits)
  let storyCopy = original
  let plans = plannedStoryCopy(storyCopy)
  let truncatedHighlights = false

  // Highlights reserve one line each so three property facts remain legible.
  // Do this even when a single long, unbroken token would otherwise be
  // truncated only in the drawtext plan and not persisted back to the editor.
  const compactHighlights = shortenHighlights(storyCopy.highlights)
  if (compactHighlights.join("\n") !== storyCopy.highlights.join("\n")) {
    storyCopy = { ...storyCopy, highlights: compactHighlights }
    truncatedHighlights = true
    plans = plannedStoryCopy(storyCopy)
  }

  const safeText = {
    headline: shortenForRole("headline", storyCopy.headline),
    supportingLine: shortenForRole("supporting_line", storyCopy.supportingLine),
    priceLine: shortenForRole("price", storyCopy.priceLine),
    cta: shortenForRole("cta", storyCopy.cta),
  }
  if (Object.entries(safeText).some(([key, value]) => value !== storyCopy[key as keyof typeof safeText])) {
    storyCopy = { ...storyCopy, ...safeText }
    plans = plannedStoryCopy(storyCopy)
  }

  if (plans.some(item => !item.fits && item.role === "highlights")) {
    const highlights = shortenHighlights(storyCopy.highlights)
    truncatedHighlights = highlights.join("\n") !== storyCopy.highlights.join("\n")
    storyCopy = { ...storyCopy, highlights }
    plans = plannedStoryCopy(storyCopy)
  }

  if (plans.some(item => !item.fits)) {
    storyCopy = {
      headline: shortenForRole("headline", storyCopy.headline),
      supportingLine: shortenForRole("supporting_line", storyCopy.supportingLine),
      highlights: shortenHighlights(storyCopy.highlights),
      priceLine: shortenForRole("price", storyCopy.priceLine),
      cta: shortenForRole("cta", storyCopy.cta),
    }
    truncatedHighlights = truncatedHighlights || storyCopy.highlights.join("\n") !== original.highlights.join("\n")
    plans = plannedStoryCopy(storyCopy)
  }

  return {
    storyCopy,
    plans,
    fits: plans.every(item => item.fits),
    adjusted: JSON.stringify(storyCopy) !== JSON.stringify(original) || plans.some(item => {
      const style = styleFor(item.role)
      return item.fontSize !== style.fontSize || item.lineSpacing !== style.lineSpacing
    }),
    requiresAiCondensation,
    truncatedHighlights,
  }
}

/**
 * One deterministic plan is shared by the Story renderer, validation, and
 * review overlay. It is deliberately also the final fallback for legacy copy,
 * so no valid creative is clipped by a stale character-count gate.
 */
function applyEditorialLayout(plan: StoryTextLayout, style: StoryLayoutStyle): StoryTextLayout {
  if (style === "editorial_panel") return plan
  const y = {
    full_bleed_gradient: { headline: 320, supporting_line: 565, highlights: 855, price: 1250, cta: 1460 },
    lower_third: { headline: 835, supporting_line: 1050, highlights: 1230, price: 1400, cta: 1515 },
    dark_panel: { headline: 390, supporting_line: 635, highlights: 910, price: 1280, cta: 1470 },
    light_panel: { headline: 365, supporting_line: 610, highlights: 905, price: 1280, cta: 1470 },
  }[style][plan.role]
  const centered = style === "light_panel" && ["headline", "supporting_line", "cta"].includes(plan.role)
  const boxOpacity = style === "full_bleed_gradient"
    ? Math.min(plan.boxOpacity, 0.18)
    : style === "dark_panel"
      ? Math.max(plan.boxOpacity, 0.72)
      : style === "light_panel"
        ? Math.min(plan.boxOpacity, 0.28)
        : Math.max(plan.boxOpacity, 0.62)
  return { ...plan, y, alignment: centered ? "center" : plan.alignment, boxOpacity }
}

/** Five deliberate layouts share one safe typography contract but have visibly distinct hierarchy and placement. */
export function layoutStoryCopy(copy: StoryCopy, style: StoryLayoutStyle = "editorial_panel"): StoryTextLayout[] {
  return fitStoryCopy(copy).plans.map(plan => applyEditorialLayout(plan, style))
}

export function storyLayoutError(copy: StoryCopy): string | null {
  const overflow = fitStoryCopy(copy).plans.find(item => !item.fits)
  return overflow
    ? `Story ${overflow.role.replaceAll("_", " ")} cannot fit its mobile-safe area.`
    : null
}

export function storyCopyEditorFeedback(copy: StoryCopy) {
  const fit = fitStoryCopy(copy)
  if (!fit.fits) return "This Story has no valid mobile-safe layout. Shorten the visual copy before rendering."
  if (fit.truncatedHighlights) return "Highlights will be shortened to one readable mobile-safe line each when saved."
  if (fit.adjusted) return "The renderer will use a compact mobile-safe text layout when saved."
  return null
}

export function storyTypographyFontFile(
  style: ReelTypographyStyle
) {
  return reelTypographyFontFile(style)
}

export function storyLogoLayout(
  composition: StoryComposition
) {
  if (!composition.logo.enabled) return null

  const size = STORY_LAYOUT.logo.size[composition.logo.scale]
  const margin = STORY_LAYOUT.logo.margin
  const left = Math.max(STORY_LAYOUT.safe.left, margin)
  const top = Math.max(STORY_LAYOUT.safe.top, margin)
  const right = STORY_LAYOUT.width - STORY_LAYOUT.safe.right - size
  const bottom = STORY_LAYOUT.height - STORY_LAYOUT.safe.bottom - size

  switch (composition.logo.placement) {
    case "top_left": return { size, x: left, y: top }
    case "top_right": return { size, x: right, y: top }
    case "bottom_left": return { size, x: left, y: bottom }
    case "bottom_right": return { size, x: right, y: bottom }
  }
}
