import { describe, expect, it } from "vitest"

import { REEL_LAYOUT, layoutReelOverlay, logoLayout } from "@/lib/marketing/reel-layout"

describe("Reel safe-zone layout", () => {
  it("uses an explicit 1080 by 1920 mobile canvas", () => {
    expect(REEL_LAYOUT).toMatchObject({ width: 1080, height: 1920 })
  })

  it("keeps a hook inside the top safe area", () => {
    const layout = layoutReelOverlay({ text: "A considered arrival in North Goa", type: "hook", position: "top_left" })
    expect(layout?.y).toBeGreaterThanOrEqual(REEL_LAYOUT.safe.top)
    expect(layout?.x).toBeGreaterThanOrEqual(REEL_LAYOUT.safe.left)
  })

  it("keeps lower text above the bottom safe area", () => {
    const layout = layoutReelOverlay({ text: "Arrange a private viewing", type: "cta", position: "lower_left" })
    expect((layout?.y ?? 0) + 300).toBeLessThanOrEqual(REEL_LAYOUT.height - REEL_LAYOUT.safe.bottom + 1)
  })

  it("avoids the right interaction rail for right-aligned text", () => {
    const layout = layoutReelOverlay({ text: "Four bedrooms", position: "lower_right", type: "key_fact" })
    expect(layout?.x).toBeLessThanOrEqual(REEL_LAYOUT.width - REEL_LAYOUT.safe.right)
  })

  it("reflows long visual copy to bounded lines", () => {
    const layout = layoutReelOverlay({ text: "An exceptionally long visual statement with several unnecessary words that should stay readable on a mobile screen", type: "key_fact", position: "lower_left" })
    expect(layout?.text.split("\n").length).toBeLessThanOrEqual(3)
    expect(layout?.text.length).toBeLessThanOrEqual(90)
  })

  it("truncates overflow rather than shrinking below the minimum font size", () => {
    const layout = layoutReelOverlay({ text: "word ".repeat(100), type: "hook", position: "top_left" })
    expect(layout?.text).toContain("…")
    expect(layout?.fontSize).toBeGreaterThanOrEqual(48)
  })

  it("uses a more prominent opening title than property metadata", () => {
    const hook = layoutReelOverlay({ text: "Villa Verde", type: "hook", position: "top_left" })
    const label = layoutReelOverlay({ text: "Parra, Goa", type: "property_label", position: "top_left" })
    expect(hook?.fontSize).toBeGreaterThan(label?.fontSize ?? 0)
  })

  it("centres end-card copy in a bounded safe region", () => {
    const layout = layoutReelOverlay({ text: "Discover Villa Verde\nArrange a private viewing", type: "end_card", position: "center" })
    expect(layout).toMatchObject({ alignment: "center" })
    expect(layout?.y).toBeGreaterThan(REEL_LAYOUT.safe.top)
  })

  it("returns no overlay plan for blank visual text", () => {
    expect(layoutReelOverlay({ text: "   ", type: "cta" })).toBeNull()
  })

  it("places a top-right logo before the reserved right rail", () => {
    const logo = logoLayout("top_right", "medium")
    expect((logo?.x ?? 0) + (logo?.size ?? 0)).toBeLessThanOrEqual(REEL_LAYOUT.width - REEL_LAYOUT.safe.right)
    expect(logo?.y).toBeGreaterThanOrEqual(REEL_LAYOUT.safe.top)
  })

  it("places a bottom-left logo above the bottom safe area", () => {
    const logo = logoLayout("bottom_left", "small")
    expect((logo?.y ?? 0) + (logo?.size ?? 0)).toBeLessThanOrEqual(REEL_LAYOUT.height - REEL_LAYOUT.safe.bottom)
  })

  it("uses a centred logo for end-card-only treatment and none for disabled logos", () => {
    expect(logoLayout("none", "small")).toBeNull()
    const logo = logoLayout("end_card_only", "large")
    expect((logo?.x ?? 0) + (logo?.size ?? 0) / 2).toBeCloseTo(REEL_LAYOUT.width / 2)
  })
})
