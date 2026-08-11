import { describe, expect, it } from "vitest"

import { ReelCompositionSchema } from "@/lib/marketing/schemas"
import { CompositionService } from "@/lib/marketing/services/composition-service"

const propertyId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const firstAsset = "b2041f1f-89e9-4a59-a8de-00169502f523"
const secondAsset = "ba3fe72a-dfb7-43e5-9d81-964c6602ea6a"

describe("structured Reel storyboard composition", () => {
  function compose() {
    return CompositionService.composeStoryboard({
      propertyId,
      storyboard: {
        hook: "A quieter way to arrive",
        scenes: [
          { assetId: firstAsset, overlayText: "Villa Verde", durationSeconds: 3, overlayPosition: "top_left", overlayType: "hook" },
          { assetId: secondAsset, overlayText: "Parra, Goa", durationSeconds: 3.5, overlayPosition: "lower_left", overlayType: "property_label" },
        ],
        endCard: { headline: "Villa Verde", cta: "Arrange a private viewing" },
      },
      creative: { caption: "Caption", hashtags: ["#NorthGoa"], cta: "Arrange a private viewing", coverText: "Villa Verde", transitions: ["fade"] },
      audio: { type: "none", label: "Silent Reel" },
      logo: { placement: "end_card_only", scale: "small", opacity: 0.65, assetId: firstAsset },
    })
  }

  it("creates a short, explicit end-card scene without copying the post caption", () => {
    const composition = compose()
    const endCard = composition.scenes.at(-1)
    expect(endCard?.overlay).toMatchObject({ type: "end_card", position: "center" })
    expect(endCard?.overlay?.text).toContain("Arrange a private viewing")
    expect(endCard?.overlay?.text).not.toContain("Caption")
  })

  it("preserves source asset IDs and timeline durations", () => {
    const composition = compose()
    expect(composition.scenes.map(scene => scene.assetId)).toEqual([firstAsset, secondAsset, secondAsset])
    expect(composition.duration).toBe(9.5)
  })

  it("preserves explicit private-audio and logo decisions", () => {
    const composition = compose()
    expect(composition.audio).toMatchObject({ type: "none" })
    expect(composition.logo).toMatchObject({ placement: "end_card_only", opacity: 0.65 })
  })

  it("validates the generated composition through the worker schema", () => {
    expect(() => ReelCompositionSchema.parse(compose())).not.toThrow()
  })
})
