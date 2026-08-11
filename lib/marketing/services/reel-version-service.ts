import { CreativeOutputSchema, ReelCompositionSchema } from "@/lib/marketing/schemas"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { CompositionService } from "@/lib/marketing/services/composition-service"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import type { MarketingContent, PropertyFactSnapshot, ReelComposition, ReelStoryboard } from "@/lib/marketing/types"

function currentStoryboard(content: MarketingContent, composition: ReelComposition): ReelStoryboard {
  const visualScenes = composition.scenes.filter(scene => scene.overlay?.type !== "end_card")
  return {
    hook: content.hook ?? visualScenes[0]?.overlay?.text ?? "Property spotlight",
    scenes: visualScenes.map((scene, index) => ({
      assetId: scene.assetId,
      overlayText: scene.overlay?.text ?? "",
      durationSeconds: scene.duration,
      overlayPosition: scene.overlay?.position === "top" ? "top_left"
        : scene.overlay?.position === "bottom" ? "lower_left"
          : (scene.overlay?.position as "top_left" | "top_right" | "center" | "lower_left" | "lower_right" | undefined) ?? (index === 0 ? "top_left" : "lower_left"),
      overlayType: scene.overlay?.type === "end_card" || !scene.overlay?.type ? (index === 0 ? "hook" : "key_fact") : scene.overlay.type,
    })),
    endCard: {
      headline: composition.coverText || content.headline || "Discover more",
      cta: composition.cta || content.cta || "Contact us",
    },
  }
}

function existingComposition(content: MarketingContent, sourceAssetIds: string[]) {
  try {
    return ReelCompositionSchema.parse(content.composition)
  } catch {
    const creative = CreativeOutputSchema.parse(content.creative)
    const propertyId = typeof content.propertySnapshot.id === "string" ? content.propertySnapshot.id : content.primaryPropertyId
    if (!propertyId) throw new Error("The source property facts are unavailable for this Reel.")
    return CompositionService.composeReel({ propertyId, assetIds: sourceAssetIds, creative })
  }
}

export class ReelVersionService {
  static async improve(input: { contentId: string; prompt: string; adminId: string }) {
    const record = await MarketingRepository.getContentById(input.contentId)
    if (!record) throw new Error("Content not found.")
    if (record.content.contentType !== "reel") throw new Error("Only Reels can be improved with a storyboard.")
    if (!["approved", "ready_for_review"].includes(record.content.status)) {
      throw new Error("Approve or return this Reel to review before creating a new version.")
    }
    const sourceAssetIds = record.assets
      .filter(asset => asset.kind === "original_reference" && (asset.mediaType === "image" || asset.mediaType === "video"))
      .map(asset => asset.id)
    const composition = existingComposition(record.content, sourceAssetIds)
    const [settings, activeLogo, versions] = await Promise.all([
      MarketingRepository.getBrandSettings(),
      MarketingRepository.getActiveBrandLogo(),
      MarketingRepository.listReelVersions(record.content.id),
    ])

    // Preserve the legacy/current edit as Version 1 before generating a new
    // draft. This never touches its rendered asset or source property media.
    if (!versions.length) {
      const existingRender = record.assets.find(asset => asset.kind === "rendered_media" && asset.mediaType === "video")
      const baseline = await MarketingRepository.createReelVersion({
        contentId: record.content.id,
        composition,
        sourceAssetIds: [...new Set(composition.scenes.map(scene => scene.assetId))],
        logoSettings: composition.logo ?? null,
        audioSettings: composition.audio,
        userPrompt: "Initial Reel version",
        createdBy: input.adminId,
        status: existingRender ? "rendered" : "approved",
      })
      if (existingRender) {
        await MarketingRepository.markReelVersionRendered({ id: baseline.id, renderedAssetId: existingRender.id, makeCurrent: true })
      }
    }

    const storyboard = await CreativeAIService.improveReelStoryboard({
      property: record.content.propertySnapshot as PropertyFactSnapshot,
      creativeDirection: record.content.creativeDirection,
      settings,
      sourceAssetIds,
      currentStoryboard: currentStoryboard(record.content, composition),
      userPrompt: input.prompt,
    })
    const logo = composition.logo ?? {
      placement: settings.defaultReelLogoPlacement,
      scale: settings.defaultReelLogoScale,
      opacity: settings.defaultReelLogoOpacity,
      assetId: activeLogo?.id ?? null,
    }
    const revised = CompositionService.composeStoryboard({
      propertyId: composition.propertyId,
      storyboard,
      creative: {
        caption: composition.caption,
        hashtags: composition.hashtags,
        cta: composition.cta,
        coverText: composition.coverText,
        transitions: composition.scenes.map(scene => scene.transitionOut),
      },
      audio: composition.audio,
      logo,
    })
    const version = await MarketingRepository.createReelVersion({
      contentId: record.content.id,
      composition: revised,
      sourceAssetIds: [...new Set(revised.scenes.map(scene => scene.assetId))],
      logoSettings: revised.logo ?? null,
      audioSettings: revised.audio,
      userPrompt: input.prompt,
      createdBy: input.adminId,
      status: "draft",
    })
    await MarketingRepository.updateContent(record.content.id, { status: "ready_for_review", last_error: null }, input.adminId)
    await MarketingRepository.addAuditLog({ actorId: input.adminId, contentId: record.content.id, action: "reel_version.improved", metadata: { versionId: version.id, versionNumber: version.versionNumber } })
    return version
  }
}
