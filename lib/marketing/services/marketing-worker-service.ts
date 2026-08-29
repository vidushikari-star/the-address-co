import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { publishableAssets, validateInstagramPublishability } from "@/lib/marketing/content-delivery"
import { resolveMarketingContract } from "@/lib/marketing/content-contract"
import { composeStaticInstagramContent, staticRenderJobType } from "@/lib/marketing/instagram-static-composition"
import { isInstagramPublishingEnabled } from "@/lib/marketing/feature-flags"
import { logRenderStage, RenderStageError, renderStageFailure, sanitizeRenderDiagnostic } from "@/lib/marketing/render-diagnostics"
import { CompositionService } from "@/lib/marketing/services/composition-service"
import { BrandAssetService } from "@/lib/marketing/services/brand-asset-service"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import {
  InstagramApiError,
  InstagramCarouselChildContainerError,
  InstagramContainerPendingError,
  InstagramContainerTerminalError,
  InstagramService,
} from "@/lib/marketing/services/instagram-service"
import { MediaEligibilityService } from "@/lib/marketing/services/media-eligibility-service"
import { RenderDeferredError, RenderService } from "@/lib/marketing/services/render-service"
import { normalizeReelTypographyStyle } from "@/lib/marketing/reel-typography"
import { TokenCryptoService } from "@/lib/marketing/services/token-crypto-service"
import { ReelCompositionSchema, StoryCompositionSchema } from "@/lib/marketing/schemas"
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
  const contentType = row.content_type as MarketingContent["contentType"]
  const composition = record(row.composition)
  const marketingContract = resolveMarketingContract({ contentType, composition })
  return {
    id: String(row.id),
    campaignId: row.campaign_id as string | null,
    accountId: row.account_id as string | null,
    primaryPropertyId: row.primary_property_id as string | null,
    propertySnapshot: record(row.property_snapshot),
    contentType,
    format: marketingContract.format,
    objective: marketingContract.objective,
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
    composition,
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

function safeRenderDiagnostics(error: unknown) {
  return error instanceof RenderStageError ? error.diagnostics : undefined
}

function isTerminalPublishingFailure(job: MarketingJob, error: unknown) {
  return job.type === "publish_instagram" && (
    error instanceof PublishingTerminalError ||
    error instanceof InstagramCarouselChildContainerError ||
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
    const reconciledPublish = Number(record(row).reconciled_publish_count ?? 0)
    if (requeued || failedPublish || reconciledPublish) {
      console.warn(`[marketing-worker] recovered stale jobs: requeued=${requeued} failed_publish=${failedPublish} reconciled_publish=${reconciledPublish}`)
    }
  }

  /**
   * Terminal publishing failures change the job, publication, and content in
   * one database transaction. The sequential fallback keeps older test/local
   * adapters useful, but production always has the SQL RPC from this phase.
   */
  private static async propagateTerminalPublishingFailure(
    admin: ReturnType<typeof createAdminSupabaseClient>,
    job: MarketingJob,
    errorMessage: string,
  ) {
    if (job.contentId && typeof admin.rpc === "function") {
      const result = await admin.rpc("fail_marketing_publication", {
        p_job_id: job.id,
        p_content_id: job.contentId,
        p_error: errorMessage,
      })
      if (result && !result.error) return
      if (result?.error) console.error("[marketing-worker] atomic publication failure transition failed", result.error)
    }

    await admin.from("marketing_jobs").update({
      status: "failed",
      error: errorMessage,
      progress: 100,
      locked_at: null,
      locked_by: null,
    }).eq("id", job.id)
    if (job.contentId) {
      await admin.from("marketing_publications").update({ status: "failed", last_error: errorMessage }).eq("content_id", job.contentId)
      await admin.from("marketing_content").update({ status: "failed", last_error: errorMessage }).eq("id", job.contentId)
    }
  }

  /**
   * A user can safely regenerate a static creative while an earlier job is
   * running. The earlier render will reject its obsolete token; do not let
   * that expected stale-job failure overwrite the newer creative as failed.
   */
  private static async isCurrentStaticRenderJob(
    admin: ReturnType<typeof createAdminSupabaseClient>,
    job: MarketingJob,
  ) {
    if (!job.contentId || !["render_image", "render_carousel"].includes(job.type)) return true
    const renderToken = typeof job.input.renderToken === "string" ? job.input.renderToken : null
    if (!renderToken) return true

    const table = admin.from("marketing_content")
    // Small test adapters historically only implement update chains. Their
    // default is the old behaviour; production Supabase always supports this
    // read and gets stale-token protection.
    if (typeof table.select !== "function") return true
    const { data, error } = await table.select("composition").eq("id", job.contentId).maybeSingle()
    if (error) {
      console.error("Static render current-token check failed:", JSON.stringify({ contentId: job.contentId, error: error.name ?? "DatabaseError" }))
      return false
    }
    return record(record(data).composition).renderToken === renderToken
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
        const renderDiagnostics = safeRenderDiagnostics(caught)
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
          const deferredMessage = `Reel render deferred for worker capacity (attempt ${job.attempts} of ${job.maxAttempts}).`
          if (job.attempts >= job.maxAttempts) {
            const terminalMessage = `Reel render stopped after ${job.maxAttempts} worker-capacity attempts. Retry rendering when worker capacity is available.`
            await admin.from("marketing_jobs").update({
              status: "failed",
              error: terminalMessage,
              progress: 100,
              output: {
                ...job.output,
                render_diagnostics: {
                  failure_category: "resource_deferred",
                  attempts: job.attempts,
                  max_attempts: job.maxAttempts,
                  last_failure: safeError(caught),
                },
              },
              locked_at: null,
              locked_by: null,
            }).eq("id", job.id)
            if (job.contentId) {
              await admin.from("marketing_content")
                .update({ status: "failed", last_error: terminalMessage })
                .eq("id", job.contentId)
              const reelVersionId = typeof job.input.reelVersionId === "string" ? job.input.reelVersionId : null
              if (reelVersionId) {
                await admin.from("marketing_reel_versions")
                  .update({ status: "failed", last_error: terminalMessage })
                  .eq("id", reelVersionId)
              }
            }
            results.push({ id: job.id, status: "failed" })
            continue
          }
          await admin.from("marketing_jobs").update({
            status: "queued",
            error: deferredMessage,
            progress: 0,
            run_after: new Date(Date.now() + 2 * 60_000).toISOString(),
            locked_at: null,
            locked_by: null,
          }).eq("id", job.id)
          if (job.contentId) {
            await admin.from("marketing_content")
              .update({ last_error: deferredMessage })
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
            await this.propagateTerminalPublishingFailure(admin, job, timeoutError)
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
        const staleStaticRender = ["render_image", "render_carousel"].includes(job.type) &&
          !(await this.isCurrentStaticRenderJob(admin, job))
        if (staleStaticRender) {
          await admin.from("marketing_jobs").update({
            status: "cancelled",
            error: "Superseded by a newer static render request.",
            progress: 100,
            locked_at: null,
            locked_by: null,
          }).eq("id", job.id)
          console.info("[marketing-worker] cancelled stale static render", JSON.stringify({ contentId: job.contentId, jobId: job.id }))
          results.push({ id: job.id, status: "skipped" })
          continue
        }
        const retry = !isTerminalRenderTermination(job, caught) && !isTerminalPublishingFailure(job, caught) && job.attempts < job.maxAttempts
        if (job.type === "publish_instagram" && !retry) {
          await this.propagateTerminalPublishingFailure(admin, job, errorMessage)
        } else {
          await admin.from("marketing_jobs").update({
            status: retry ? "queued" : "failed",
            error: errorMessage,
            progress: retry ? 0 : 100,
            ...(renderDiagnostics ? { output: { ...job.output, render_diagnostics: renderDiagnostics } } : {}),
            run_after: new Date(Date.now() + Math.min(30, 2 ** job.attempts) * 60_000).toISOString(),
            locked_at: null,
            locked_by: null,
          }).eq("id", job.id)
        }
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
          if (retry) {
            await admin.from("marketing_content").update({ last_error: errorMessage }).eq("id", job.contentId)
          }
          if (caught instanceof InstagramApiError && caught.isAuthenticationFailure) {
            await admin.from("marketing_accounts").update({ status: "expired" })
              .eq("platform", "instagram")
              .in("status", ["connected", "expiring", "error"])
          }
          // A terminal publish failure was propagated atomically above. A
          // retryable error remains in publishing while its protected job is
          // still queued, never after the job becomes terminal.
        }
        if (!retry && job.contentId && job.type !== "publish_instagram") {
          if (await this.isCurrentStaticRenderJob(admin, job)) {
            await admin.from("marketing_content").update({ status: "failed", last_error: errorMessage }).eq("id", job.contentId)
          } else {
            console.info("[marketing-worker] ignored stale static render failure", JSON.stringify({ contentId: job.contentId, jobId: job.id }))
          }
        }
        results.push({ id: job.id, status: "failed" })
      }
    }
    return results
  }

  /** Explicit Railway one-off diagnostic; it never claims a queued job. */
  static async runRenderEnvironmentSelfTest(contentId?: string) {
    let sourceAsset: MarketingAsset | null = null
    if (contentId) {
      const record = await this.loadContent(contentId)
      sourceAsset = record.assets.find(asset => asset.kind === "original_reference" && asset.mediaType === "image" && Boolean(asset.sourceUrl)) ?? null
    }
    return RenderService.runEnvironmentSelfTest({ sourceAsset })
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

    const property = content.propertySnapshot as PropertyFactSnapshot
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
      format: content.format,
      objective: content.objective,
      creativeDirection: content.creativeDirection,
      settings: brandSettings,
      recentContent: ((recent ?? []) as Row[]).map(item => ({
        hook: item.hook as string | null,
        headline: item.headline as string | null,
        creativeDirection: item.creative_direction as string | null,
      })),
    })
    const contract = resolveMarketingContract(content)
    const selection = contract.mediaSelection.assetIds.length
      ? contract.mediaSelection
      : MediaEligibilityService.automaticSelection(contract.format, assets)
    const selected = MediaEligibilityService.assert({ format: contract.format, selection, assets })
    const shouldRenderReel = contract.format === "reel"
    const logoTreatment = contract.brandTreatment.logo
    let activeLogo: Row | null = null
    let activeLogoError: { message: string } | null = null
    if (logoTreatment.enabled) {
      let logoQuery = admin.from("marketing_brand_assets").select("id").eq("kind", "logo").eq("active", true)
      if (logoTreatment.assetId) logoQuery = logoQuery.eq("id", logoTreatment.assetId)
      const result = await logoQuery.maybeSingle()
      activeLogo = result.data as Row | null
      activeLogoError = result.error
      if (!activeLogo) throw new Error("The selected brand logo is unavailable. Choose an active logo or disable the logo and generate again.")
    }
    if (activeLogoError) throw activeLogoError
    const composition = shouldRenderReel
      ? CompositionService.composeReel({
          propertyId: property.id,
          assetIds: selected.map(asset => asset.id),
          creative,
          logo: logoTreatment.enabled ? {
            placement: logoTreatment.placement,
            scale: logoTreatment.scale,
            opacity: logoTreatment.opacity,
            assetId: String(activeLogo!.id),
          } : undefined,
          typographyStyle: normalizeReelTypographyStyle(brandSettings.fontFamily),
        })
      : composeStaticInstagramContent({
          content: {
            ...content,
            composition: content.composition,
          },
          assets,
          creative,
          logo: activeLogo ? { id: String(activeLogo.id), enabled: true } : null,
          typographyStyle: normalizeReelTypographyStyle(brandSettings.fontFamily),
        })

    const renderType = shouldRenderReel ? "render_reel" : staticRenderJobType(contract.format)
    await admin.from("marketing_content").update({
      ...(shouldRenderReel ? {} : { status: content.status }),
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
    if (shouldRenderReel) {
      await this.queueGeneratedReelRender({
        contentId: content.id,
        idempotencyKey: `${renderType}:${content.id}`,
      })
    } else {
      const renderToken = String((composition as Row).renderToken)
      const { error: queueError } = await admin.from("marketing_jobs").upsert({
        content_id: content.id,
        type: renderType,
        input: { renderToken },
        idempotency_key: `${renderType}:${content.id}:${renderToken}`,
        run_after: new Date().toISOString(),
        max_attempts: 3,
      }, { onConflict: "idempotency_key", ignoreDuplicates: true })
      if (queueError) throw queueError
      const { error: transitionError } = await admin.from("marketing_content")
        .update({ status: "rendering", last_error: null })
        .eq("id", content.id)
      if (transitionError) throw transitionError
    }
    await admin.from("marketing_audit_logs").insert({
      content_id: content.id,
      action: "content.generated",
      metadata: { provider: process.env.OPENAI_API_KEY ? "openai" : "deterministic_fallback", selectedAssetCount: selected.length, format: contract.format, objective: contract.objective },
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
    const marketingContract = resolveMarketingContract(content)
    if (marketingContract.format !== "reel") throw renderStageFailure("input", new Error("Reel render job does not match the stored delivery format."))
    try {
      MediaEligibilityService.assert({
        format: "reel",
        selection: {
          mode: marketingContract.mediaSelection.mode,
          assetIds: [...new Set(composition.scenes.map(scene => scene.assetId))],
        },
        assets,
      })
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
        // Removing/replacing a logo must not corrupt an already-created Reel
        // version. A later render without that private asset simply omits it.
        const brandAsset = await BrandAssetService.resolveLogo({
          assetId: composition.logo.assetId,
          activeOnly: true,
        })
        if (brandAsset) {
          logo = {
            sourceUrl: brandAsset.signedUrl,
            mimeType: brandAsset.mimeType,
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
      metadata: { duration: output.duration, byteLength: output.byteLength, format: "1080x1920-h264-mp4", width: 1080, height: 1920, aspectRatio: "9:16", reelVersionId },
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
    const requestedRenderToken = typeof job.input.renderToken === "string" ? job.input.renderToken : null
    const renderToken = typeof composition.renderToken === "string" ? composition.renderToken : null
    if (!renderToken || (requestedRenderToken && requestedRenderToken !== renderToken)) {
      throw new Error("This static render is stale. Regenerate the creative before rendering it again.")
    }
    const marketingContract = resolveMarketingContract(content)
    if ((marketingContract.format === "carousel") !== carousel || !["feed_single", "carousel", "story"].includes(marketingContract.format)) {
      throw new Error("Static render job type does not match this Instagram format.")
    }
    if (marketingContract.format === "story") {
      if (carousel) throw new Error("A Story cannot be rendered as a Carousel.")
      const parsed = StoryCompositionSchema.safeParse(content.composition)
      if (!parsed.success) throw new Error("Story composition is invalid. Edit the Story creative before rendering.")
      const source = assets.find(asset => asset.id === parsed.data.sourceAssetId && asset.kind === "original_reference")
      if (!source || source.mediaType !== "image") throw new Error("Story source must be an available property image.")
      let logo: { sourceUrl: string; mimeType: "image/png" | "image/webp" } | null = null
      if (parsed.data.logo.enabled && parsed.data.logo.assetId) {
        const brandAsset = await BrandAssetService.resolveLogo({
          assetId: parsed.data.logo.assetId,
          activeOnly: true,
          required: true,
        })
        if (!brandAsset) throw new Error("The selected brand logo is unavailable. Choose an active logo or disable the logo and render again.")
        logo = { sourceUrl: brandAsset.signedUrl, mimeType: brandAsset.mimeType }
      }
      const output = await RenderService.renderStory({ contentId: content.id, asset: source, composition: parsed.data, logo })
      const { error: assetError } = await admin.from("marketing_content_assets").insert({
        content_id: content.id,
        kind: "rendered_media",
        media_type: "image",
        storage_path: output.storagePath,
        metadata: {
          byteLength: output.byteLength,
          instagramFormat: "story",
          sourceAssetId: source.id,
          renderToken,
          width: output.width,
          height: output.height,
          aspectRatio: output.aspectRatio,
          layoutStyle: parsed.data.layoutStyle,
          textRoles: ["headline", "supporting_line", "highlights", "price", "cta"],
          logoApplied: Boolean(logo),
        },
        sort_order: 0,
      })
      if (assetError) throw assetError
      await admin.from("marketing_content").update({ status: job.input.resumeApproved === true ? "approved" : "ready_for_review", last_error: null }).eq("id", content.id)
      await admin.from("marketing_audit_logs").insert({ content_id: content.id, action: "render.completed", metadata: { imageCount: 1, instagramFormat: "story", renderToken } })
      return { imageCount: 1, instagramFormat: "story" }
    }

    const selection = marketingContract.mediaSelection.assetIds.length
      ? marketingContract.mediaSelection
      : MediaEligibilityService.automaticSelection(marketingContract.format, assets)
    const sources = MediaEligibilityService.assert({ format: marketingContract.format, selection, assets })
    const logoTreatment = marketingContract.brandTreatment.logo
    const logo = logoTreatment.enabled
      ? await BrandAssetService.resolveLogo({ assetId: logoTreatment.assetId, activeOnly: true, required: true })
      : null
    if (logoTreatment.enabled && (logoTreatment.placement === "none" || logoTreatment.placement === "end_card_only")) {
      throw new Error("Static Post and Carousel logo treatment needs a corner placement. Choose a corner or disable the logo.")
    }
    const outputs = await Promise.all(sources.map((asset, index) => RenderService.renderImage({
      contentId: content.id,
      asset,
      aspectRatio: "4:5",
      // The Carousel policy is intentionally cover-only. Every other slide
      // remains unmarked clean property photography.
      logo: logo && (!carousel || index === 0) ? {
        sourceUrl: logo.signedUrl,
        mimeType: logo.mimeType,
        placement: logoTreatment.placement as "top_left" | "top_right" | "bottom_left" | "bottom_right",
        scale: logoTreatment.scale,
        opacity: logoTreatment.opacity,
      } : null,
    })))
    await admin.from("marketing_content_assets").insert(outputs.map((output, index) => ({
      content_id: content.id,
      kind: "rendered_media",
      media_type: "image",
      storage_path: output.storagePath,
      metadata: {
        byteLength: output.byteLength,
        instagramFormat: carousel ? "carousel" : "feed_single",
        sourceAssetId: sources[index]!.id,
        renderToken,
        width: 1080,
        height: 1350,
        aspectRatio: "4:5",
        logoApplied: outputs[index]!.logoApplied,
      },
      sort_order: index,
    })))
    await admin.from("marketing_content").update({ status: job.input.resumeApproved === true ? "approved" : "ready_for_review", last_error: null }).eq("id", content.id)
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
    const publishabilityError = validateInstagramPublishability(content, assets)
    if (publishabilityError) throw new PublishingTerminalError(publishabilityError)
    const media = publishableAssets(content, assets)
    if (!media.length) throw new PublishingTerminalError("Publishing safety check failed: approved publish media is missing.")
    const caption = [content.caption, content.hashtags.join(" ")].filter(Boolean).join(" ").trim()
    if (content.format !== "story" && !caption) throw new PublishingTerminalError("Publishing safety check failed: a caption is required.")

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
      let container: Awaited<ReturnType<typeof InstagramService.createContainer>>
      try {
        container = await InstagramService.createContainer({
          content,
          mediaAssets: withSignedUrls,
          accessToken,
          instagramAccountId: String(accountRow.external_account_id),
        })
      } catch (error) {
        if (error instanceof InstagramCarouselChildContainerError) {
          await admin.from("marketing_publications").update({
            request_diagnostics: {
              ...record(publicationRow.request_diagnostics),
              child_container_ids: error.childContainerIds,
              failed_stage: "child_container",
            },
          }).eq("id", publicationRow.id as string)
        }
        throw error
      }
      containerId = container.containerId
      const { error: containerPersistenceError } = await admin.from("marketing_publications").update({
        external_container_id: containerId,
        request_diagnostics: {
          ...record(publicationRow.request_diagnostics),
          container_created: true,
          ...(container.childContainerIds?.length ? { child_container_ids: container.childContainerIds } : {}),
        },
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
