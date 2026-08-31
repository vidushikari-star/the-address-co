import { creativeOutputSchemaForFormat, ReelCompositionSchema } from "@/lib/marketing/schemas"
import { defaultMarketingContract, resolveMarketingContract, withMarketingContract } from "@/lib/marketing/content-contract"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { CompositionService } from "@/lib/marketing/services/composition-service"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import { MediaEligibilityService } from "@/lib/marketing/services/media-eligibility-service"
import type { MarketingContent, PropertyFactSnapshot, ReelComposition, ReelStoryboard } from "@/lib/marketing/types"

function currentStoryboard(content: MarketingContent, composition: ReelComposition): ReelStoryboard {
  const visualScenes = composition.scenes.filter(scene => scene.overlay?.type !== "end_card")
  return {
    hook: content.hook ?? visualScenes[0]?.overlay?.text ?? "Property spotlight",
    typographyStyle: composition.typographyStyle ?? "modern_sans",
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
    const creative = creativeOutputSchemaForFormat(resolveMarketingContract(content).format).parse(content.creative)
    const propertyId = typeof content.propertySnapshot.id === "string" ? content.propertySnapshot.id : content.primaryPropertyId
    if (!propertyId) throw new Error("The source property facts are unavailable for this Reel.")
    return CompositionService.composeReel({ propertyId, assetIds: sourceAssetIds, creative })
  }
}

function sourceAssetIdsForComposition(composition: ReelComposition, fallbackAssetIds: string[]) {
  const fromComposition = [...new Set(composition.scenes.map(scene => scene.assetId))]
  return fromComposition.length ? fromComposition : fallbackAssetIds
}

function withAudio(composition: ReelComposition, audio: ReelComposition["audio"]) {
  return ReelCompositionSchema.parse({ ...composition, audio })
}

export class ReelVersionService {
  /**
   * Audio is a material render input. It therefore belongs to a mutable draft
   * version, never to a historic rendered version. For legacy rendered Reels
   * we first preserve a Version 1 record, then create Version 2 as the edit.
   */
  static async setAudio(input: {
    contentId: string
    audio: ReelComposition["audio"]
    adminId: string
  }) {
    const record = await MarketingRepository.getContentById(input.contentId)
    if (!record) throw new Error("Content not found.")
    if (record.content.contentType !== "reel") throw new Error("Audio can only be selected for a Reel.")

    const sourceAssetIds = record.assets
      .filter(asset => asset.kind === "original_reference" && (asset.mediaType === "image" || asset.mediaType === "video"))
      .map(asset => asset.id)
    const versions = await MarketingRepository.listReelVersions(record.content.id)
    const editableDraft = versions.find(version => version.status === "draft")
    const baseComposition = editableDraft?.composition ?? existingComposition(record.content, sourceAssetIds)
    const composition = withAudio(baseComposition, input.audio)

    let version
    if (editableDraft) {
      version = await MarketingRepository.updateDraftReelVersion({
        id: editableDraft.id,
        composition,
        audioSettings: composition.audio,
      })
    } else {
      // Version history began after the first production render. Preserve that
      // immutable derivative before creating a new edit-version for the audio.
      if (!versions.length) {
        const existingRender = record.assets.find(asset => asset.kind === "rendered_media" && asset.mediaType === "video")
        if (existingRender) {
          const baseline = await MarketingRepository.createReelVersion({
            contentId: record.content.id,
            composition: baseComposition,
            sourceAssetIds: sourceAssetIdsForComposition(baseComposition, sourceAssetIds),
            logoSettings: baseComposition.logo ?? null,
            audioSettings: baseComposition.audio,
            userPrompt: "Initial Reel version",
            createdBy: input.adminId,
            status: "rendered",
          })
          await MarketingRepository.markReelVersionRendered({ id: baseline.id, renderedAssetId: existingRender.id, makeCurrent: true })
        }
      }

      version = await MarketingRepository.createReelVersion({
        contentId: record.content.id,
        composition,
        sourceAssetIds: sourceAssetIdsForComposition(composition, sourceAssetIds),
        logoSettings: composition.logo ?? null,
        audioSettings: composition.audio,
        userPrompt: input.audio.type === "uploaded" ? "Audio updated" : "Audio removed — silent Reel",
        createdBy: input.adminId,
        status: "draft",
      })
    }

    const status = record.content.status === "approved"
      ? "ready_for_review"
      : record.content.status === "failed"
        ? "draft"
        : record.content.status
    const content = await MarketingRepository.updateContent(record.content.id, {
      composition,
      status,
      last_error: null,
    }, input.adminId)
    return { content, version, createdDraft: !editableDraft }
  }

  /**
   * M3's intentionally small storyboard editor changes only a mutable draft
   * composition. It preserves historic rendered versions and the persisted
   * source snapshot while making the user's scene order authoritative.
   */
  static async updateStoryboard(input: {
    contentId: string
    scenes: ReelComposition["scenes"]
    adminId: string
  }) {
    const record = await MarketingRepository.getContentById(input.contentId)
    if (!record) throw new Error("Content not found.")
    if (record.content.contentType !== "reel") throw new Error("Storyboard editing is available for Reels only.")
    if (!["draft", "changes_requested", "ready_for_review", "failed"].includes(record.content.status)) {
      throw new Error("Return this Reel to edits before changing its storyboard.")
    }

    const contract = resolveMarketingContract(record.content)
    const visualScenes = input.scenes.filter(scene => scene.overlay?.type !== "end_card")
    const sourceAssetIds = visualScenes.map(scene => scene.assetId)
    if (!sourceAssetIds.length) throw new Error("A Reel needs at least one property media scene.")
    if (new Set(sourceAssetIds).size !== sourceAssetIds.length) throw new Error("A Reel scene can use each selected property asset only once.")
    const selection = { mode: "curated" as const, assetIds: sourceAssetIds }
    MediaEligibilityService.assert({ format: "reel", selection, assets: record.assets })

    const current = existingComposition(record.content, sourceAssetIds)
    let cursor = 0
    const normalizedVisualScenes = visualScenes.map(scene => {
      const duration = Math.max(1.5, Math.min(12, Number(scene.duration.toFixed(2))))
      const next = { ...scene, start: cursor, duration }
      cursor += duration
      return next
    })
    const existingEndCard = current.scenes.find(scene => scene.overlay?.type === "end_card")
    const scenes = existingEndCard ? [
      ...normalizedVisualScenes,
      { ...existingEndCard, assetId: normalizedVisualScenes[normalizedVisualScenes.length - 1]!.assetId, start: cursor },
    ] : normalizedVisualScenes
    const nextContract = defaultMarketingContract({
      format: "reel",
      objective: contract.objective,
      assetIds: sourceAssetIds,
      selectionMode: "curated",
      creativeDirection: contract.creativeDirection,
      brandTreatment: contract.brandTreatment,
    })
    const composition = ReelCompositionSchema.parse(withMarketingContract({
      ...current,
      scenes,
      duration: scenes.reduce((total, scene) => total + scene.duration, 0),
    }, nextContract))

    const versions = await MarketingRepository.listReelVersions(record.content.id)
    const editableDraft = versions.find(version => version.status === "draft")
    if (!editableDraft && !versions.length) {
      // Older Reels may have a rendered asset but no version-history record.
      // Keep that production output immutable before opening the first M3 edit.
      const existingRender = record.assets.find(asset => asset.kind === "rendered_media" && asset.mediaType === "video")
      if (existingRender) {
        const originalSourceAssetIds = record.assets
          .filter(asset => asset.kind === "original_reference" && (asset.mediaType === "image" || asset.mediaType === "video"))
          .map(asset => asset.id)
        const baseline = await MarketingRepository.createReelVersion({
          contentId: record.content.id,
          composition: current,
          sourceAssetIds: sourceAssetIdsForComposition(current, originalSourceAssetIds),
          logoSettings: current.logo ?? null,
          audioSettings: current.audio,
          userPrompt: "Initial Reel version",
          createdBy: input.adminId,
          status: "rendered",
        })
        await MarketingRepository.markReelVersionRendered({ id: baseline.id, renderedAssetId: existingRender.id, makeCurrent: true })
      }
    }
    const version = editableDraft
      ? await MarketingRepository.updateDraftReelVersion({
          id: editableDraft.id,
          composition,
          sourceAssetIds,
          logoSettings: composition.logo ?? null,
          audioSettings: composition.audio,
        })
      : await MarketingRepository.createReelVersion({
          contentId: record.content.id,
          composition,
          sourceAssetIds,
          logoSettings: composition.logo ?? null,
          audioSettings: composition.audio,
          userPrompt: "Storyboard edited manually",
          createdBy: input.adminId,
          status: "draft",
        })
    const status = record.content.status === "ready_for_review"
      ? "changes_requested"
      : record.content.status === "failed"
        ? "draft"
        : record.content.status
    const content = await MarketingRepository.updateContent(record.content.id, {
      composition,
      status,
      last_error: null,
    }, input.adminId)
    await MarketingRepository.addAuditLog({
      actorId: input.adminId,
      contentId: record.content.id,
      action: "reel.storyboard_updated",
      metadata: { versionId: version.id, sceneCount: normalizedVisualScenes.length, sourceAssetIds },
    })
    return { content, version, createdDraft: !editableDraft }
  }

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
    let revised: ReelComposition
    try {
      revised = CompositionService.composeStoryboard({
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
    } catch (error) {
      // The raw Zod issue can contain generated copy. Keep that only in the
      // server diagnostic and give the editor a concise recovery action.
      const name = error && typeof error === "object" && "name" in error ? String(error.name) : "UnknownError"
      console.error("Reel storyboard composition validation failed:", JSON.stringify({ name }))
      throw new Error("AI generated text that was too long for the Reel layout. Please try again or use a shorter creative instruction.")
    }
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
    await MarketingRepository.updateContent(record.content.id, { composition: revised, status: "ready_for_review", last_error: null }, input.adminId)
    await MarketingRepository.addAuditLog({ actorId: input.adminId, contentId: record.content.id, action: "reel_version.improved", metadata: { versionId: version.id, versionNumber: version.versionNumber } })
    return version
  }
}
