import { describe, expect, it } from "vitest"

import { normalizeReelTypographyStyle, reelTypographyFontFile } from "@/lib/marketing/reel-typography"

describe("Reel typography", () => {
  it("maps every approved style to a fixed Docker-installed font file", () => {
    expect(reelTypographyFontFile("editorial_serif")).toBe("/usr/share/fonts/truetype/lindenhill/LindenHill.otf")
    expect(reelTypographyFontFile("refined_serif")).toBe("/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf")
    expect(reelTypographyFontFile("modern_sans")).toBe("/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf")
    expect(reelTypographyFontFile("minimal_sans")).toBe("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
  })

  it("converts editorial requests to a controlled style and never accepts a font path", () => {
    expect(normalizeReelTypographyStyle("editorial and luxurious")).toBe("editorial_serif")
    expect(normalizeReelTypographyStyle("/tmp/untrusted-font.ttf")).toBe("modern_sans")
  })
})
