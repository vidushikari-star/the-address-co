import { getInstagramFormat } from "@/lib/marketing/instagram-format"
import { resolveMarketingContract } from "@/lib/marketing/content-contract"
import { fitStoryCopy, storyLayoutError } from "@/lib/marketing/story-layout"
import type {
  MarketingAsset,
  MarketingContent,
  MarketingContentType,
  StoryComposition,
  StoryCopy,
} from "@/lib/marketing/types"

type Creative = {
  caption: string
  hashtags: string[]
  cta: string
  coverText: string
  carouselSlides: string[]
  storyCopy: StoryCopy
}

function orderedImages(assets: MarketingAsset[]) {
  const images = [...assets]
    .filter(asset => asset.kind === "original_reference" && asset.mediaType === "image" && Boolean(asset.sourceUrl))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
  const cover = images.find(asset => asset.metadata.isCover === true)
  return cover ? [cover, ...images.filter(asset => asset.id !== cover.id)] : images
}

function selectedIds(content: Pick<MarketingContent, "composition" | "contentType">) {
  const composition = content.composition as { selectedAssetIds?: unknown }
  const contract = resolveMarketingContract(content)
  if (contract.mediaSelection.assetIds.length) return contract.mediaSelection.assetIds
  return Array.isArray(composition.selectedAssetIds)
    ? composition.selectedAssetIds.filter((id): id is string => typeof id === "string")
    : []
}

/**
 * Creates the immutable input contract for a static Instagram render. Every
 * generated derivative records this token and source ordering, so review and
 * Meta publishing cannot accidentally use a raw CRM asset or a stale render.
 */
export function composeStaticInstagramContent(input: {
  content: Pick<MarketingContent, "contentType" | "composition" | "primaryPropertyId" | "propertySnapshot">
  assets: MarketingAsset[]
  creative: Creative
  renderToken?: string
  logo?: { id: string; enabled?: boolean } | null
  typographyStyle?: StoryComposition["typographyStyle"]
}) {
  const marketingContract = resolveMarketingContract(input.content)
  const format = getInstagramFormat(marketingContract.format)
  if (format.id === "reel") throw new Error("Reels require a Reel composition.")

  const propertyId = input.content.primaryPropertyId ?? String(input.content.propertySnapshot.id ?? "")
  if (!propertyId) throw new Error("The source property facts are unavailable for this creative.")
  const images = orderedImages(input.assets)
  const existingSelection = selectedIds(input.content)
  const byId = new Map(images.map(asset => [asset.id, asset]))
  const selected = existingSelection.length
    ? existingSelection.map(id => byId.get(id)).filter((asset): asset is MarketingAsset => Boolean(asset))
    : images
  const renderToken = input.renderToken ?? crypto.randomUUID()

  if (format.id === "story") {
    const source = selected[0]
    if (!source) throw new Error("A Story needs one selected image source before it can be rendered.")
    const fit = fitStoryCopy(input.creative.storyCopy)
    if (!fit.fits) throw new Error("Story copy cannot fit its mobile-safe layout. Shorten the visual copy and try again.")
    const composition: StoryComposition = {
      propertyId,
      format: "story",
      aspectRatio: "9:16",
      sourceAssetId: source.id,
      storyCopy: fit.storyCopy,
      layoutStyle: "editorial_panel",
      typographyStyle: input.typographyStyle ?? "modern_sans",
      renderToken,
      logo: {
        enabled: Boolean(input.logo?.enabled ?? input.logo),
        placement: "top_right",
        scale: "small",
        opacity: 0.8,
        assetId: input.logo?.id ?? null,
      },
      marketingContract: {
        ...marketingContract,
        brandTreatment: {
          ...marketingContract.brandTreatment,
          logo: {
            ...marketingContract.brandTreatment.logo,
            enabled: Boolean(input.logo?.enabled ?? input.logo),
            assetId: input.logo?.id ?? null,
            placement: "top_right",
          },
        },
      },
    }
    const layoutError = storyLayoutError(composition.storyCopy)
    if (layoutError) throw new Error(layoutError)
    return composition
  }

  const selectedAssetIds = format.id === "carousel"
    ? selected.slice(0, format.maximumMediaCount).map(asset => asset.id)
    : selected.slice(0, 1).map(asset => asset.id)
  if (selectedAssetIds.length < format.minimumMediaCount) {
    throw new Error(format.id === "carousel"
      ? "A Carousel requires 2–10 selected image sources before rendering."
      : "An Instagram Feed Post needs one selected image source before rendering.")
  }

  return {
    propertyId,
    format: format.id,
    aspectRatio: format.aspectRatio,
    selectedAssetIds,
    renderToken,
    caption: input.creative.caption,
    hashtags: input.creative.hashtags,
    cta: input.creative.cta,
    coverText: input.creative.coverText,
    carouselSlides: input.creative.carouselSlides,
    marketingContract,
  }
}

export function staticRenderJobType(formatOrContentType: MarketingContentType | "feed_single" | "carousel" | "story") {
  return getInstagramFormat(formatOrContentType).id === "carousel" ? "render_carousel" as const : "render_image" as const
}
