import {
  reelTypographyFontFile,
} from "@/lib/marketing/reel-typography"

import type {
  ReelTypographyStyle,
  StoryComposition,
  StoryCopy,
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
}

type StoryTextStyle = {
  y: number
  fontSize: number
  lineSpacing: number
  maximumLines: number
  maximumCharactersPerLine: number
  boxOpacity: number
  alignment: "left" | "center"
}

function styleFor(role: StoryTextRole): StoryTextStyle {
  switch (role) {
    case "headline":
      return { y: 290, fontSize: 76, lineSpacing: 16, maximumLines: 2, maximumCharactersPerLine: 21, boxOpacity: 0.42, alignment: "left" }
    case "supporting_line":
      return { y: 560, fontSize: 42, lineSpacing: 11, maximumLines: 3, maximumCharactersPerLine: 38, boxOpacity: 0.34, alignment: "left" }
    case "highlights":
      return { y: 850, fontSize: 40, lineSpacing: 10, maximumLines: 3, maximumCharactersPerLine: 36, boxOpacity: 0.4, alignment: "left" }
    case "price":
      return { y: 1270, fontSize: 50, lineSpacing: 12, maximumLines: 2, maximumCharactersPerLine: 30, boxOpacity: 0.55, alignment: "left" }
    case "cta":
      return { y: 1460, fontSize: 44, lineSpacing: 10, maximumLines: 2, maximumCharactersPerLine: 34, boxOpacity: 0.58, alignment: "left" }
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

function wrap(value: string, maximumCharactersPerLine: number) {
  const lines: string[] = []

  for (const paragraph of normalize(value).split("\n")) {
    let line = ""
    for (const word of paragraph.split(" ")) {
      const next = line ? `${line} ${word}` : word
      if (!line || next.length <= maximumCharactersPerLine) {
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

function plan(role: StoryTextRole, value: string): StoryTextLayout | null {
  const text = normalize(value)
  if (!text) return null

  const style = styleFor(role)
  const lines = wrap(text, style.maximumCharactersPerLine)

  return {
    role,
    text: lines.join("\n"),
    lines,
    x: STORY_LAYOUT.safe.left,
    y: style.y,
    fontSize: style.fontSize,
    lineSpacing: style.lineSpacing,
    boxOpacity: style.boxOpacity,
    alignment: style.alignment,
    fits: lines.length <= style.maximumLines,
  }
}

/**
 * One deterministic plan is shared by the Story renderer, validation, and
 * review overlay. A false `fits` result blocks rendering rather than clipping
 * visual copy into Instagram UI areas.
 */
export function layoutStoryCopy(
  copy: StoryCopy
): StoryTextLayout[] {
  const highlights = copy.highlights
    .map(item => normalize(item))
    .filter(Boolean)
    .map(item => `• ${item}`)
    .join("\n")

  return [
    plan("headline", copy.headline),
    plan("supporting_line", copy.supportingLine),
    plan("highlights", highlights),
    plan("price", copy.priceLine),
    plan("cta", copy.cta),
  ].filter((item): item is StoryTextLayout => Boolean(item))
}

export function storyLayoutError(
  copy: StoryCopy
): string | null {
  const overflow = layoutStoryCopy(copy).find(item => !item.fits)
  return overflow
    ? `Story ${overflow.role.replaceAll("_", " ")} does not fit its mobile-safe area.`
    : null
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
