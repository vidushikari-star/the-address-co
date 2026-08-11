/**
 * The renderer accepts only these symbolic styles. They map to fixed font
 * files installed in the Railway image; no AI or browser input becomes a
 * font path or is fetched at render time.
 */
export const REEL_TYPOGRAPHY_STYLES = [
  "editorial_serif",
  "refined_serif",
  "modern_sans",
  "minimal_sans",
] as const

export type ReelTypographyStyle = (typeof REEL_TYPOGRAPHY_STYLES)[number]

const FONT_FILE_BY_STYLE: Record<ReelTypographyStyle, string> = {
  editorial_serif: "/usr/share/fonts/truetype/lindenhill/LindenHill.otf",
  refined_serif: "/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf",
  modern_sans: "/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf",
  minimal_sans: "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
}

export function normalizeReelTypographyStyle(value: unknown): ReelTypographyStyle {
  const normalized = typeof value === "string" ? value.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_") : ""
  if ((REEL_TYPOGRAPHY_STYLES as readonly string[]).includes(normalized)) return normalized as ReelTypographyStyle
  if (/(editorial|luxury|lora|playfair)/.test(normalized)) return "editorial_serif"
  if (/(refined|serif|baskerville)/.test(normalized)) return "refined_serif"
  if (/(minimal|dejavu)/.test(normalized)) return "minimal_sans"
  return "modern_sans"
}

export function reelTypographyFontFile(style: unknown) {
  return FONT_FILE_BY_STYLE[normalizeReelTypographyStyle(style)]
}
