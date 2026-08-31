import { describe, expect, it } from "vitest"

import { defaultMarketingContract, legacyContractForContentType, resolveMarketingContract, storageContentTypeForFormat } from "@/lib/marketing/content-contract"
import { getInstagramFormat } from "@/lib/marketing/instagram-format"
import { staticRenderJobType } from "@/lib/marketing/instagram-static-composition"
import { EDITORIAL_GENERATION_CONTRACT } from "@/lib/marketing/generation-output-contract"
import { MARKETING_CONTENT_STATE_CONTRACT } from "@/lib/marketing/content-state-contract"
import { getInstagramPlatformCapability } from "@/lib/marketing/instagram-platform-capabilities"

describe("Marketing V2 content contracts", () => {
  it("uses canonical delivery formats and never lets an objective choose a renderer", () => {
    const feedArchitecture = defaultMarketingContract({ format: "feed_single", objective: "architecture" })
    const storyPrice = defaultMarketingContract({ format: "story", objective: "price_update" })

    expect(getInstagramFormat(feedArchitecture.format)).toMatchObject({ id: "feed_single", publisherPath: "image", coreTextBurnedIntoMedia: false })
    expect(getInstagramFormat(storyPrice.format)).toMatchObject({ id: "story", publisherPath: "story", coreTextBurnedIntoMedia: true })
    expect(staticRenderJobType(feedArchitecture.format)).toBe("render_image")
    expect(staticRenderJobType(storyPrice.format)).toBe("render_image")
  })

  it("resolves each supported delivery format only to its own contract", () => {
    expect(getInstagramFormat("feed_single").id).toBe("feed_single")
    expect(getInstagramFormat("carousel").id).toBe("carousel")
    expect(getInstagramFormat("story").id).toBe("story")
    expect(getInstagramFormat("reel").id).toBe("reel")
    expect(staticRenderJobType("carousel")).toBe("render_carousel")
  })

  it("fails fast for an unknown delivery format", () => {
    expect(() => getInstagramFormat("unknown" as never)).toThrow("Unsupported Marketing")
  })

  it("keeps historic content readable through finite explicit mappings", () => {
    expect(legacyContractForContentType("price_update")).toEqual({ format: "feed_single", objective: "price_update" })
    expect(legacyContractForContentType("architecture_highlight")).toEqual({ format: "feed_single", objective: "architecture" })
    expect(resolveMarketingContract({ contentType: "carousel", composition: { selectedAssetIds: ["asset-a", "asset-b"] } })).toMatchObject({
      format: "carousel",
      objective: "property_spotlight",
      mediaSelection: { mode: "curated", assetIds: ["asset-a", "asset-b"] },
    })
  })

  it("keeps a persisted Create Studio Story contract on the Story delivery path", () => {
    const story = defaultMarketingContract({ format: "story", objective: "property_spotlight" })

    expect(storageContentTypeForFormat("story")).toBe("story")
    expect(resolveMarketingContract({
      contentType: "single_image",
      composition: { marketingContract: story },
    })).toMatchObject({ format: "story", objective: "property_spotlight" })
  })

  it("keeps generated metadata separate from allowed deterministic visual fields", () => {
    expect(EDITORIAL_GENERATION_CONTRACT.feed_single).toMatchObject({ deterministicVisualFields: [], prohibitedVisualFields: expect.arrayContaining(["caption", "headline"]) })
    expect(EDITORIAL_GENERATION_CONTRACT.carousel).toMatchObject({ deterministicVisualFields: [], metadataFields: ["caption", "cta", "hashtags", "altText"] })
    expect(EDITORIAL_GENERATION_CONTRACT.story.deterministicVisualFields).toEqual(["storyCopy"])
    expect(EDITORIAL_GENERATION_CONTRACT.reel.deterministicVisualFields).toContain("onScreenText")
  })

  it("documents an actionable non-circular job state progression", () => {
    expect(MARKETING_CONTENT_STATE_CONTRACT.draft.nextAction).toContain("generate")
    expect(MARKETING_CONTENT_STATE_CONTRACT.rendering.nextAction).toContain("bounded")
    expect(MARKETING_CONTENT_STATE_CONTRACT.ready_for_review.nextAction).toContain("approve")
    expect(MARKETING_CONTENT_STATE_CONTRACT.failed.nextAction).toContain("retry")
  })

  it("keeps platform output requirements separate from product media policy", () => {
    expect(getInstagramPlatformCapability("carousel")).toMatchObject({
      publishingSurface: "feed",
      renderedMediaType: "image",
      requiredOutput: { width: 1080, height: 1350, aspectRatio: "4:5" },
    })
  })
})
