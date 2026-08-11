import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { contentRequiresRendering, publishableAssets } from "@/lib/marketing/content-delivery"
import { isInstagramPublishingEnabled } from "@/lib/marketing/feature-flags"
import { logRenderStage, RenderStageError, renderStageFailure, sanitizeRenderDiagnostic } from "@/lib/marketing/render-diagnostics"
import { CompositionService } from "@/lib/marketing/services/composition-service"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import {
  InstagramApiError,
  InstagramContainerPendingError,
  InstagramContainerTerminalError,
  InstagramService,
} from "@/lib/marketing/services/instagram-service"
import { MediaAnalysisService } from "@/lib/marketing/services/media-analysis-service"
import { RenderDeferredError, RenderService } from "@/lib/marketing/services/render-service"
import { normalizeReelTypographyStyle } from "@/lib/marketing/reel-typography"
import { TokenCryptoService } from "@/lib/marketing/services/token-crypto-service"
import { ReelCompositionSchema } from "@/lib/marketing/schemas"
import type {
  MarketingAsset,
  MarketingBrandSettings,
  MarketingContent,
  MarketingJob,
  MarketingJobType,
  PropertyFactSnapshot,
} from "@/lib/marketing/types"

type Row = Record<string, unknown>

export const RENDER_JOB_TYPES = ["render_image", "render_carousel", "render_reel"] as const satisfies readonly MarketingJobType[]
export const VERCEL_SAFE_JOB_TYPES = ["analyze_media", "generate_creative", "publish_instagram", "sync_publish_status", "sync_analytics"] as const satisfies readonly MarketingJobType[]

function record(value: unknown): Row {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Row
    : {}
}

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function mapAsset(row: Row): MarketingAsset {
  return {
    id: String(row.id),
    contentId: String(row.content_id),
    propertyImageId: row.property_image_id as string | null,
    kind: row.kind as MarketingAsset["kind"],
    mediaType: row.media_type as MarketingAsset["mediaType"],
    storagePath: row.storage_path as string | null,
    sourceUrl: row.source_url as string | null,
    metadata: record(row.metadata),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
  }
}

function mapContent(row: Row): MarketingContent {
  return {
    id: String(row.id),
    campaignId: row.campaign_id as string | null,
    accountId: row.account_id as string | null,
    primaryPropertyId: row.primary_property_id as string | null,
    propertySnapshot: record(row.property_snapshot),
    contentType: row.content_type as MarketingContent["contentType"],
    creativeDirection: String(row.creative_direction ?? "surprise_me"),
    title: row.title as string | null,
    status: row.status as MarketingContent["status"],
    caption: row.caption as string | null,
    shortCaption: row.short_caption as string | null,
    headline: row.headline as string | null,
    hook: row.hook as string | null,
    cta: row.cta as string | null,
    hashtags: strings(row.hashtags),
    altText: row.alt_text as string | null,
    creative: record(row.creative),
    composition: record(row.composition),
    proposedPublishAt: row.proposed_publish_at as string | null,
    publishedAt: row.published_at as string | null,
    rejectionReason: row.rejection_reason as string | null,
    lastError: row.last_error as string | null,
    activeReelVersionId: row.active_reel_version_id as string | null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapJob(row: Row): MarketingJob {
  return {
    id: String(row.id),
    contentId: row.content_id as string | null,
    type: row.type as MarketingJob["type"],
    status: row.status as MarketingJob["status"],
    progress: Number(row.progress ?? 0),
    input: record(row.input),
    output: record(row.output),
    error: row.error as string | null,
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 3),
    runAfter: String(row.run_after),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function mapSettings(row: Row): MarketingBrandSettings {
  return {
    brandName: row.brand_name as string | null,
    instagramHandle: row.instagram_handle as string | null,
    website: row.website as string | null,
    whatsappCta: row.whatsapp_cta as string | null,
    preferredTone: String(row.preferred_tone ?? "Premium, sophisticated, aspirational luxury real estate."),
    preferredCta: row.preferred_cta as string | null,
    defaultHashtags: strings(row.default_hashtags),
    excludedWords: strings(row.excluded_words),
    fontFamily: row.font_family as string | null,
    brandColors: record(row.brand_colors),
    timezone: String(row.timezone ?? "Asia/Kolkata"),
    defaultReelLogoPlacement: (row.default_reel_logo_placement as MarketingBrandSettings["defaultReelLogoPlacement"]) ?? "none",
    defaultReelLogoOpacity: Number(row.default_reel_logo_opacity ?? 0.65),
    defaultReelLogoScale: (row.default_reel_logo_scale as MarketingBrandSettings["defaultReelLogoScale"]) ?? "small",
  }
}

function safeError(error: unknown) {
  return sanitizeRenderDiagnostic(error, 2_000)
}

class PublishingDisabledError extends Error {}
class PublishingDeferredError extends Error {
  constructor(readonly runAfter: string) {
    super("Instagram publication is not due yet.")
    this.name = "PublishingDeferredError"
  }
}
class PublishingTerminalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "PublishingTerminalError"
  }
}

function logInstagramPublisher(stage: "eligibility" | "container" | "processing" | "publish" | "persistence", status: "started" | "ok" | "created" | "pending" | "failed", details?: Record<string, string | number | boolean>) {
  const suffix = details
    ? ` ${Object.entries(details).map(([key, value]) => `${key}=${String(value)}`).join(" ")}`
    : ""
  const message = `[instagram-publisher] stage=${stage} status=${status}${suffix}`
  if (status === "failed") console.error(message)
  else console.info(message)
}

function isTerminalRenderTermination(job: MarketingJob, error: unknown) {
  return job.type === "render_reel" &&
    error instanceof RenderStageError &&
    error.stage === "ffmpeg" &&
    /(Render timed out after|terminated(?: externally)? by SIGKILL|terminated(?: externally)? by SIGTERM)/.test(error.message)
}

function isTerminalPublishingFailure(job: MarketingJob, error: unknown) {
  return job.type === "publish_instagram" && (
    error instanceof PublishingTerminalError ||
    error instanceof InstagramContainerTerminalError ||
    (error instanceof InstagramApiError && !error.isRecoverable)
  )
}

export class MarketingWorkerService {
  /**
   * A process crash must not leave a lease permanently held. The database
   * recovery function deliberately fails stale Instagram jobs rather than
   * retrying a potentially accepted Meta publish request.
   */
  private static async recoverExpiredLeases(admin: ReturnType<typeof createAdminSupabaseClient>) {
    if (typeof admin.rpc !== "function") return
    const result = await admin.rpc("recover_stale_marketing_jobs", {})
    // Unit-test adapters from older queue tests do not implement RPCs. A real
    // Supabase client always returns this result object.
    if (!result) return
    if (result.error) throw result.error
    const row = Array.isArray(result.data) ? result.data[0] : null
    const requeued = Number(record(row).requeued_count ?? 0)
    const failedPublish = Number(record(row).failed_publish_count ?? 0)
    if (requeued || failedPublish) {
      console.warn(`[marketing-worker] recovered stale jobs: requeued=${requeued} failed_publish=${failedPublish}`)
    }
  }

  static async run(limit = 3, options?: { jobTypes?: readonly MarketingJobType[]; diagnosticsLabel?: string }) {
    const admin = createAdminSupabaseClient()
    await this.recoverExpiredLeases(admin)
    const workerId = `cron-${crypto.randomUUID()}`
    const jobTypes = options?.jobTypes ?? [...RENDER_JOB_TYPES, ...VERCEL_SAFE_JOB_TYPES]
    if (!jobTypes.length) return []
    const { data, error } = await admin
      .from("marketing_jobs")
      .select("*")
      .eq("status", "queued")
      .in("type", [...jobTypes])
      .lte("run_after", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(Math.min(Math.max(limit, 1), 10))
    if (error) throw error

    if (options?.diagnosticsLabel) {
      const rows = (data ?? []) as Row[]
      const byType = rows.reduce<Record<string, number>>((counts, row) => {
        const type = String(row.type ?? "unknown")
        counts[type] = (counts[type] ?? 0) + 1
        return counts
      }, {})
      const byStatus = rows.reduce<Record<string, number>>((counts, row) => {
        const status = String(row.status ?? "unknown")
        counts[status] = (counts[status] ?? 0) + 1
        return counts
      }, {})
      console.info(`[marketing-worker] eligible ${options.diagnosticsLabel} jobs: ${JSON.stringify({ count: rows.length, types: byType, statuses: byStatus })}`)
    }

    const results: Array<{ id: string; status: "completed" | "failed" | "skipped" }> = []
    for (const row of (data ?? []) as Row[]) {
      const { data: locked, error: lockError } = await admin
        .from("marketing_jobs")
        .update({
          status: "running",
          locked_at: new Date().toISOString(),
          locked_by: workerId,
          attempts: Number(row.attempts ?? 0) + 1,
          progress: 5,
        })
        .eq("id", row.id as string)
        .eq("status", "queued")
        .select("*")
        .maybeSingle()
      if (lockError) throw lockError
      if (!locked) {
        results.push({ id: String(row.id), status: "skipped" })
        continue
      }

      const job = mapJob(locked as Row)
      try {
        const output = await this.process(job)
        await admin.from("marketing_jobs").update({ status: "completed", progress: 100, output, error: null }).eq("id", job.id)
        results.push({ id: job.id, status: "completed" })
      } catch (caught) {
        const errorMessage = safeError(caught)
        if (caught instanceof PublishingDisabledError) {
          await admin.from("marketing_jobs").update({
            status: "queued",
            error: errorMessage,
            progress: 0,
            run_after: new Date(Date.now() + 5 * 60_000).toISOString(),
            locked_at: null,
            locked_by: null,
          }).eq("id", job.id)
          results.push({ id: job.id, status: "skipped" })
          continue
        }
        if (caught instanceof RenderDeferredError && job.type === "render_reel") {
          await admin.from("marketing_jobs").update({
            status: "queued",
            error: safeError(caught),
            progress: 0,
            run_after: new Date(Date.now() + 2 * 60_000).toISOString(),
            locked_at: null,
            locked_by: null,
          }).eq("id", job.id)
          if (job.contentId) {
            await admin.from("marketing_content")
              .update({ last_error: safeError(caught) })
              .eq("id", job.contentId)
          }
          results.push({ id: job.id, status: "skipped" })
          continue
        }
        if (caught instanceof PublishingDeferredError && job.type === "publish_instagram") {
          await admin.from("marketing_jobs").update({
            status: "queued",
            error: null,
            progress: 0,
            run_after: caught.runAfter,
            locked_at: null,
            locked_by: null,
          }).eq("id", job.id)
          results.push({ id: job.id, status: "skipped" })
          continue
        }
        if (caught instanceof InstagramContainerPendingError && job.type === "publish_instagram") {
          if (job.attempts >= job.maxAttempts) {
            const timeoutError = `Instagram media container did not finish after ${job.maxAttempts} processing checks.`
            logInstagramPublisher("processing", "failed", { checks: job.maxAttempts, reason: "processing_timeout" })
            await admin.from("marketing_jobs").update({
              status: "failed",
              error: timeoutError,
              progress: 100,
              locked_at: null,
              locked_by: null,
            }).eq("id", job.id)
            if (job.contentId) {
              await admin.from("marketing_publications").update({ status: "failed", last_error: timeoutError }).eq("content_id", job.contentId)
              await admin.from("marketing_content").update({ status: "failed", last_error: timeoutError }).eq("id", job.contentId)
            }
            results.push({ id: job.id, status: "failed" })
            continue
          }
          await admin.from("marketing_jobs").update({
            status: "queued",
            error: errorMessage,
            progress: 45,
            run_after: new Date(Date.now() + 60_000).toISOString(),
            locked_at: null,
            locked_by: null,
          }).eq("id", job.id)
          results.push({ id: job.id, status: "skipped" })
          continue
        }
        const retry = !isTerminalRenderTermination(job, caught) && !isTerminalPublishingFailure(job, caught) && job.attempts < job.maxAttempts
        await admin.from("marketing_jobs").update({
          status: retry ? "queued" : "failed",
          error: errorMessage,
          progress: retry ? 0 : 100,
          run_after: new Date(Date.now() + Math.min(30, 2 ** job.attempts) * 60_000).toISOString(),
          locked_at: null,
          locked_by: null,
        }).eq("id", job.id)
        if (job.contentId && job.type === "render_reel") {
          await admin.from("marketing_content").update({ last_error: errorMessage }).eq("id", job.contentId)
          const reelVersionId = typeof job.input.reelVersionId === "string" ? job.input.reelVersionId : null
          if (reelVersionId && !retry) {
            await admin.from("marketing_reel_versions")
              .update({ status: "failed", last_error: errorMessage })
              .eq("id", reelVersionId)
          }
        }
        if (job.contentId && job.type === "publish_instagram") {
          await admin.from("marketing_content").update({ last_error: errorMessage }).eq("id", job.contentId)
          if (caught instanceof InstagramApiError && caught.isAuthenticationFailure) {
            await admin.from("marketing_accounts").update({ status: "expired" })
              .eq("platform", "instagram")
              .in("status", ["connected", "expiring", "error"])
          }
          if (!retry) {
            await admin.from("marketing_publications").update({ status: "failed", last_error: errorMessage }).eq("content_id", job.contentId)
          }
        }
        if (!retry && job.contentId) {
          await admin.from("marketing_content").update({ status: "failed", last_error: errorMessage }).eq("id", job.contentId)
        }
        results.push({ id: job.id, status: "failed" })
      }
    }
    return results
  }

  private static async loadContent(contentId: string) {
    const admin = createAdminSupabaseClient()
    const [{ data: content, error: contentError }, { data: assets, error: assetError }] = await Promise.all([
      admin.from("marketing_content").select("*").eq("id", contentId).maybeSingle(),
      admin.from("marketing_content_assets").select("*").eq("content_id", contentId).order("sort_order"),
    ])
    if (contentError) throw contentError
    if (assetError) throw assetError
    if (!content) throw new Error("Marketing content was deleted before its job ran.")
    return {
      content: mapContent(content as Row),
      assets: ((assets ?? []) as Row[]).map(mapAsset),
    }
  }

  private static async process(job: MarketingJob): Promise<Record<string, unknown>> {
    if (!job.contentId) throw new Error("Marketing job has no content ID.")

    switch (job.type) {
      case "generate_creative": return this.generateCreative(job)
      case "render_reel": return this.renderReel(job)
      case "render_image": return this.renderImages(job, false)
      case "render_carousel": return this.renderImages(job, true)
      case "publish_instagram": return this.publishInstagram(job)
      default: throw new Error(`Unsupported marketing job type: ${job.type}`)
    }
  }

  private static async generateCreative(job: MarketingJob) {
    const admin = createAdminSupabaseClient()
    const { content, assets } = await this.loadContent(job.contentId!)
    const { data: settings, error } = await admin
      .from("marketing_brand_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()
    if (error) throw error

    const property = (job.input.propertySnapshot ?? content.propertySnapshot) as PropertyFactSnapshot
    const { data: recent } = await admin
      .from("marketing_content")
      .select("hook, headline, creative_direction")
      .eq("primary_property_id", property.id)
      .neq("id", content.id)
      .in("status", ["approved", "scheduled", "publishing", "published"])
      .order("created_at", { ascending: false })
      .limit(8)
    const brandSettings = mapSettings(record(settings))
    const creative = await CreativeAIService.generate({
      property,
      contentType: content.contentType,
      creativeDirection: content.creativeDirection,
      settings: brandSettings,
      recentContent: ((recent ?? []) as Row[]).map(item => ({
        hook: item.hook as string | null,
        headline: item.headline as string | null,
        creativeDirection: item.creative_direction as string | null,
      })),
    })
    const selected = MediaAnalysisService.analyze(property, assets)
      .filter(analysis => analysis.recommendedForReel)
      .map(analysis => analysis.assetId)
    const shouldRenderReel = content.contentType === "reel"
    const { data: activeLogo, error: activeLogoError } = shouldRenderReel && brandSettings.defaultReelLogoPlacement !== "none"
      ? await admin.from("marketing_brand_assets").select("id").eq("kind", "logo").eq("active", true).maybeSingle()
      : { data: null, error: null }
    if (activeLogoError) throw activeLogoError
    const composition = shouldRenderReel
      ? CompositionService.composeReel({
          propertyId: property.id,
          assetIds: selected,
          creative,
          logo: {
            placement: brandSettings.defaultReelLogoPlacement,
            scale: brandSettings.defaultReelLogoScale,
            opacity: brandSettings.defaultReelLogoOpacity,
            assetId: activeLogo ? String((activeLogo as Row).id) : null,
          },
          typographyStyle: normalizeReelTypographyStyle(brandSettings.fontFamily),
        })
      : {
          propertyId: property.id,
          format: content.contentType === "carousel" ? "carousel" : content.contentType === "story" ? "story" : "single_image",
          aspectRatio: content.contentType === "story" ? "9:16" : content.contentType === "carousel" ? "1:1" : "4:5",
          selectedAssetIds: selected.slice(0, content.contentType === "carousel" ? 10 : 1),
          caption: creative.caption,
          hashtags: creative.hashtags,
          cta: creative.cta,
          coverText: creative.coverText,
          audio: { type: "none", label: "No audio selected" },
        }

    const requiresRender = contentRequiresRendering(content)
    const renderType = requiresRender ? "render_reel" : null
    await admin.from("marketing_content").update({
      ...(requiresRender ? {} : { status: "ready_for_review" }),
      creative,
      composition,
      caption: creative.caption,
      short_caption: creative.shortCaption,
      headline: creative.headline,
      hook: creative.hook,
      cta: creative.cta,
      hashtags: creative.hashtags,
      alt_text: creative.altText,
    }).eq("id", content.id)
    if (renderType) {
      await this.queueGeneratedReelRender({
        contentId: content.id,
        idempotencyKey: `${renderType}:${content.id}`,
      })
    }
    await admin.from("marketing_audit_logs").insert({
      content_id: content.id,
      action: "content.generated",
      metadata: { provider: process.env.OPENAI_API_KEY ? "openai" : "deterministic_fallback", selectedAssetCount: selected.length },
    })
    await admin.from("marketing_usage_events").insert({
      content_id: content.id,
      category: "ai_generation",
      quantity: 1,
      unit: "request",
      metadata: { provider: process.env.OPENAI_API_KEY ? "openai" : "fallback" },
    })
    return { renderJobType: renderType, selectedAssetCount: selected.length }
  }

  private static async queueGeneratedReelRender(input: { contentId: string; idempotencyKey: string }) {
    const admin = createAdminSupabaseClient()
    const { data, error } = await admin
      .rpc("queue_marketing_reel_render", {
        p_content_id: input.contentId,
        p_updated_by: null,
        p_idempotency_key: input.idempotencyKey,
        p_input: {},
      })
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Render job could not be queued after creative generation.")
  }

  private static async renderReel(job: MarketingJob) {
    const admin = createAdminSupabaseClient()
    let content: MarketingContent
    let assets: MarketingAsset[]
    try {
      ({ content, assets } = await this.loadContent(job.contentId!))
    } catch (error) {
      throw renderStageFailure("input", error)
    }
    const reelVersionId = typeof job.input.reelVersionId === "string" ? job.input.reelVersionId : null
    let composition: ReturnType<typeof ReelCompositionSchema.parse>
    try {
      if (reelVersionId) {
        const { data: version, error } = await admin.from("marketing_reel_versions")
          .select("composition, content_id").eq("id", reelVersionId).eq("content_id", content.id).maybeSingle()
        if (error) throw error
        if (!version) throw new Error("Requested Reel version was not found.")
        composition = ReelCompositionSchema.parse((version as Row).composition)
      } else {
        composition = ReelCompositionSchema.parse(content.composition)
      }
    } catch (error) {
      throw renderStageFailure("input", error)
    }
    let audio: Parameters<typeof RenderService.renderReel>[0]["audio"] = null
    if (composition.audio.type === "uploaded" && composition.audio.id) {
      try {
        const { data: audioTrack, error: audioError } = await admin
          .from("marketing_audio_tracks")
          .select("storage_path, mime_type, duration_seconds")
          .eq("id", composition.audio.id)
          .maybeSingle()
        if (audioError) throw audioError

        // Tracks may be removed from the library after a Reel is rendered. Keep
        // historical content valid and render a later retry silently instead of
        // failing or attempting to source any third-party music.
        if (audioTrack) {
          const audioRow = audioTrack as Row
          const { data: signed, error: signedError } = await admin.storage
            .from("marketing-audio")
            .createSignedUrl(String(audioRow.storage_path), 60 * 60)
          if (signedError || !signed?.signedUrl) throw signedError ?? new Error("Unable to sign selected audio for rendering.")
          audio = {
            sourceUrl: signed.signedUrl,
            mimeType: audioRow.mime_type as NonNullable<typeof audio>["mimeType"],
            durationSeconds: Number(audioRow.duration_seconds),
          }
        }
      } catch (error) {
        throw renderStageFailure("download", error)
      }
    }
    let logo: Parameters<typeof RenderService.renderReel>[0]["logo"] = null
    if (composition.logo?.placement && composition.logo.placement !== "none") {
      try {
        let query = admin.from("marketing_brand_assets").select("storage_path, mime_type")
        query = composition.logo.assetId ? query.eq("id", composition.logo.assetId) : query.eq("active", true)
        const { data: brandAsset, error: logoError } = await query.maybeSingle()
        if (logoError) throw logoError
        // Removing/replacing a logo must not corrupt an already-created Reel
        // version. A later render without that private asset simply omits it.
        if (brandAsset) {
          const logoRow = brandAsset as Row
          const { data: signed, error: signedError } = await admin.storage.from("marketing-brand-assets")
            .createSignedUrl(String(logoRow.storage_path), 60 * 60)
          if (signedError || !signed?.signedUrl) throw signedError ?? new Error("Unable to sign selected logo for rendering.")
          logo = {
            sourceUrl: signed.signedUrl,
            mimeType: logoRow.mime_type as NonNullable<typeof logo>["mimeType"],
            placement: composition.logo.placement,
            scale: composition.logo.scale,
            opacity: composition.logo.opacity,
            margin: composition.logo.margin,
          }
        } else {
          logRenderStage("logo", "ok", { applied: false, reason: "logo_not_available" })
        }
      } catch (error) {
        throw renderStageFailure("download", error)
      }
    }
    const output = await RenderService.renderReel({ contentId: content.id, composition, assets, audio, logo })
    const { error: assetError } = await admin.from("marketing_content_assets").insert({
      content_id: content.id,
      kind: "rendered_media",
      media_type: "video",
      storage_path: output.storagePath,
      metadata: { duration: output.duration, byteLength: output.byteLength, format: "1080x1920-h264-mp4", reelVersionId },
      sort_order: 0,
    })
    if (assetError) throw renderStageFailure("asset_persistence", assetError)
    logRenderStage("asset_persistence", "ok", { bytes: output.byteLength })

    if (reelVersionId) {
      const { data: renderedAsset, error: lookupError } = await admin.from("marketing_content_assets")
        .select("id").eq("content_id", content.id).eq("storage_path", output.storagePath).maybeSingle()
      if (lookupError || !renderedAsset) throw renderStageFailure("version_persistence", lookupError ?? new Error("Rendered version asset was not found."))
      const { error: versionError } = await admin.from("marketing_reel_versions").update({
        status: "rendered", rendered_asset_id: (renderedAsset as Row).id, rendered_at: new Date().toISOString(), last_error: null,
      }).eq("id", reelVersionId).eq("status", "rendering")
      if (versionError) throw renderStageFailure("version_persistence", versionError)
    }

    const { error: transitionError } = await admin.from("marketing_content").update({
      status: job.input.resumeApproved === true ? "approved" : "ready_for_review",
      last_error: null,
    }).eq("id", content.id)
    if (transitionError) throw renderStageFailure("content_transition", transitionError)
    logRenderStage("content_transition", "ok", { status: job.input.resumeApproved === true ? "approved" : "ready_for_review" })
    await admin.from("marketing_audit_logs").insert({ content_id: content.id, action: "render.completed", metadata: { ...output, reelVersionId } })
    await admin.from("marketing_usage_events").insert({ content_id: content.id, category: "video_render", quantity: output.duration, unit: "second", metadata: output })
    return output
  }

  private static async renderImages(job: MarketingJob, carousel: boolean) {
    const admin = createAdminSupabaseClient()
    const { content, assets } = await this.loadContent(job.contentId!)
    const composition = record(content.composition)
    const selectedIds = strings(composition.selectedAssetIds)
    const originals = selectedIds
      .map(id => assets.find(asset => asset.id === id))
      .filter((asset): asset is MarketingAsset => Boolean(asset))
    if (!originals.length) throw new Error("No usable source assets were selected for this render.")

    const sources = carousel ? originals.slice(0, 10) : originals.slice(0, 1)
    const aspectRatio = composition.aspectRatio === "9:16" || composition.aspectRatio === "1:1" ? composition.aspectRatio : "4:5"
    const creative = record(content.creative)
    const carouselSlides = strings(creative.carouselSlides)
    const defaultOverlay = String(creative.coverText ?? content.headline ?? "")
    const outputs = await Promise.all(sources.map((asset, index) => RenderService.renderImage({
      contentId: content.id,
      asset,
      aspectRatio,
      overlayText: carousel ? carouselSlides[index] ?? defaultOverlay : defaultOverlay,
    })))
    await admin.from("marketing_content_assets").insert(outputs.map((output, index) => ({
      content_id: content.id,
      kind: "rendered_media",
      media_type: "image",
      storage_path: output.storagePath,
      metadata: { byteLength: output.byteLength, aspectRatio },
      sort_order: index,
    })))
    await admin.from("marketing_content").update({ status: "ready_for_review", last_error: null }).eq("id", content.id)
    await admin.from("marketing_audit_logs").insert({ content_id: content.id, action: "render.completed", metadata: { imageCount: outputs.length } })
    return { imageCount: outputs.length }
  }

  private static async publishInstagram(job: MarketingJob) {
    if (!isInstagramPublishingEnabled()) {
      throw new PublishingDisabledError("Instagram publishing is disabled by feature flag.")
    }
    const admin = createAdminSupabaseClient()
    const { content, assets } = await this.loadContent(job.contentId!)
    const isControlledTest = job.input.publishTest === true
    logInstagramPublisher("eligibility", "started", {
      content_type: content.contentType,
      controlled_test: isControlledTest,
      status: content.status,
    })
    if (!["approved", "scheduled", "publishing"].includes(content.status)) {
      throw new PublishingTerminalError("Publishing safety check failed: content is not approved.")
    }
    if (content.status === "approved" && !isControlledTest) {
      throw new PublishingTerminalError("Publishing safety check failed: scheduled publication is required.")
    }
    if (content.status === "scheduled") {
      if (!content.proposedPublishAt) {
        throw new PublishingTerminalError("Publishing safety check failed: scheduled time is missing.")
      }
      if (new Date(content.proposedPublishAt) > new Date()) {
        throw new PublishingDeferredError(content.proposedPublishAt)
      }
    }
    const media = publishableAssets(content, assets)
    if (!media.length) throw new PublishingTerminalError("Publishing safety check failed: approved publish media is missing.")
    const caption = [content.caption, content.hashtags.join(" ")].filter(Boolean).join(" ").trim()
    if (!caption) throw new PublishingTerminalError("Publishing safety check failed: a caption is required.")

    let accountQuery = admin
      .from("marketing_accounts")
      .select("*")
      .eq("platform", "instagram")
      .in("status", ["connected", "expiring"])
      .order("created_at", { ascending: false })
      .limit(1)
    if (content.accountId) accountQuery = accountQuery.eq("id", content.accountId)
    const { data: account, error: accountError } = await accountQuery.maybeSingle()
    if (accountError) throw accountError
    if (!account) throw new PublishingTerminalError("Publishing safety check failed: Instagram is not connected.")
    const accountRow = account as Row
    if (accountRow.token_expires_at && new Date(String(accountRow.token_expires_at)) <= new Date()) {
      await admin.from("marketing_accounts").update({ status: "expired" }).eq("id", accountRow.id as string)
      throw new PublishingTerminalError("Instagram access has expired. Reconnect the account before publishing.")
    }
    logInstagramPublisher("eligibility", "ok", { media_count: media.length, controlled_test: isControlledTest })

    const { data: existing, error: publicationError } = await admin
      .from("marketing_publications")
      .select("*")
      .eq("content_id", content.id)
      .maybeSingle()
    if (publicationError) throw publicationError
    const prior = record(existing)
    if (prior.status === "published") {
      const publishedAt = String(prior.published_at ?? new Date().toISOString())
      if (content.status !== "published") {
        const { error: repairError } = await admin.from("marketing_content")
          .update({ status: "published", published_at: publishedAt, last_error: null })
          .eq("id", content.id)
        if (repairError) throw repairError
      }
      logInstagramPublisher("persistence", "ok", { recovered: true })
      return { publicationId: prior.external_publication_id, duplicate: true }
    }

    const { data: publication, error: upsertError } = await admin
      .from("marketing_publications")
      .upsert({
        content_id: content.id,
        account_id: accountRow.id,
        platform: "instagram",
        status: "pending",
        idempotency_key: content.id,
      }, { onConflict: "content_id" })
      .select("*")
      .single()
    if (upsertError) throw upsertError
    const publicationRow = publication as Row

    const accessToken = TokenCryptoService.decrypt(String(accountRow.access_token_ciphertext))
    let containerId = publicationRow.external_container_id as string | null
    if (!containerId) {
      const { error: transitionError } = await admin.from("marketing_content")
        .update({ status: "publishing", last_error: null })
        .eq("id", content.id)
      if (transitionError) throw transitionError
      const withSignedUrls = await Promise.all(media.map(async asset => {
        if (!asset.storagePath) return asset
        // Meta needs to fetch the object asynchronously, but the bucket stays
        // private: this unlogged, per-object URL expires after six hours.
        const { data, error } = await admin.storage.from("marketing-assets").createSignedUrl(asset.storagePath, 6 * 60 * 60)
        if (error || !data?.signedUrl) throw error ?? new Error("Unable to sign approved media for Instagram.")
        return { ...asset, signedUrl: data.signedUrl }
      }))
      logInstagramPublisher("container", "started", { media_count: withSignedUrls.length })
      const container = await InstagramService.createContainer({
        content,
        mediaAssets: withSignedUrls,
        accessToken,
        instagramAccountId: String(accountRow.external_account_id),
      })
      containerId = container.containerId
      const { error: containerPersistenceError } = await admin.from("marketing_publications").update({
        external_container_id: containerId,
        request_diagnostics: { container_created: true },
        status: "processing",
        last_error: null,
      }).eq("id", publicationRow.id as string)
      if (containerPersistenceError) throw containerPersistenceError
      await admin.from("marketing_audit_logs").insert({ content_id: content.id, action: "publication.container_created", metadata: { controlledTest: isControlledTest } })
      logInstagramPublisher("container", "created", { controlled_test: isControlledTest })
    }

    const containerStatus = await InstagramService.getContainerStatus(containerId, accessToken)
    const processingStatus = String(containerStatus.status_code ?? "unknown").toUpperCase()
    if (processingStatus === "FINISHED") {
      logInstagramPublisher("processing", "ok")
    } else if (processingStatus === "ERROR" || processingStatus === "EXPIRED") {
      logInstagramPublisher("processing", "failed", { status_code: processingStatus })
      throw new InstagramContainerTerminalError(processingStatus)
    } else {
      logInstagramPublisher("processing", "pending", { status_code: processingStatus })
      throw new InstagramContainerPendingError(processingStatus)
    }
    if (publicationRow.publish_attempted_at) {
      throw new PublishingTerminalError("A prior Instagram publish attempt has an unknown result; verify Instagram before retrying.")
    }

    const { error: attemptError } = await admin.from("marketing_publications")
      .update({ publish_attempted_at: new Date().toISOString(), status: "processing" })
      .eq("id", publicationRow.id as string)
    if (attemptError) throw attemptError
    logInstagramPublisher("publish", "started")
    const published = await InstagramService.publishContainer({
      instagramAccountId: String(accountRow.external_account_id),
      accessToken,
      containerId,
    })
    const permalink = await InstagramService.getPublicationPermalink(published.publicationId, accessToken).catch(() => undefined)
    const publishedAt = new Date().toISOString()
    const { error: publicationPersistenceError } = await admin.from("marketing_publications").update({
      external_publication_id: published.publicationId,
      permalink: permalink ?? null,
      request_diagnostics: { publication_created: true },
      status: "published",
      published_at: publishedAt,
      last_error: null,
    }).eq("id", publicationRow.id as string)
    if (publicationPersistenceError) throw publicationPersistenceError
    const { error: contentPersistenceError } = await admin.from("marketing_content")
      .update({ status: "published", published_at: publishedAt, last_error: null })
      .eq("id", content.id)
    if (contentPersistenceError) throw contentPersistenceError
    await admin.from("marketing_audit_logs").insert({ content_id: content.id, action: "publication.succeeded", metadata: { controlledTest: isControlledTest } })
    await admin.from("marketing_usage_events").insert({ content_id: content.id, category: "publishing", quantity: 1, unit: "attempt", metadata: { controlledTest: isControlledTest } })
    logInstagramPublisher("publish", "ok")
    logInstagramPublisher("persistence", "ok")
    return { publicationId: published.publicationId, permalink }
  }
}
