import { createAdminSupabaseClient } from "@/lib/supabase/admin"
import { contentRequiresRendering, publishableAssets } from "@/lib/marketing/content-delivery"
import { isInstagramPublishingEnabled } from "@/lib/marketing/feature-flags"
import { CompositionService } from "@/lib/marketing/services/composition-service"
import { CreativeAIService } from "@/lib/marketing/services/creative-ai-service"
import { InstagramService } from "@/lib/marketing/services/instagram-service"
import { MediaAnalysisService } from "@/lib/marketing/services/media-analysis-service"
import { RenderService } from "@/lib/marketing/services/render-service"
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
  }
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 2_000) : "Marketing job failed."
}

class PublishingDisabledError extends Error {}

export class MarketingWorkerService {
  static async run(limit = 3, options?: { jobTypes?: readonly MarketingJobType[] }) {
    const admin = createAdminSupabaseClient()
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
        const retry = job.attempts < job.maxAttempts
        await admin.from("marketing_jobs").update({
          status: retry ? "queued" : "failed",
          error: errorMessage,
          progress: retry ? 0 : 100,
          run_after: new Date(Date.now() + Math.min(30, 2 ** job.attempts) * 60_000).toISOString(),
          locked_at: null,
          locked_by: null,
        }).eq("id", job.id)
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
      default: return { skipped: true, reason: `Unsupported worker job: ${job.type}` }
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
    const creative = await CreativeAIService.generate({
      property,
      contentType: content.contentType,
      creativeDirection: content.creativeDirection,
      settings: mapSettings(record(settings)),
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
    const composition = shouldRenderReel
      ? CompositionService.composeReel({ propertyId: property.id, assetIds: selected, creative })
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
      status: requiresRender ? "rendering" : "ready_for_review",
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
      await admin.from("marketing_jobs").upsert({
        content_id: content.id,
        type: renderType,
        input: {},
        idempotency_key: `${renderType}:${content.id}`,
      }, { onConflict: "idempotency_key", ignoreDuplicates: true })
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

  private static async renderReel(job: MarketingJob) {
    const admin = createAdminSupabaseClient()
    const { content, assets } = await this.loadContent(job.contentId!)
    const composition = ReelCompositionSchema.parse(content.composition)
    const output = await RenderService.renderReel({ contentId: content.id, composition, assets })
    await admin.from("marketing_content_assets").insert({
      content_id: content.id,
      kind: "rendered_media",
      media_type: "video",
      storage_path: output.storagePath,
      metadata: { duration: output.duration, byteLength: output.byteLength, format: "1080x1920-h264-mp4" },
      sort_order: 0,
    })
    await admin.from("marketing_content").update({
      status: job.input.resumeApproved === true ? "approved" : "ready_for_review",
      last_error: null,
    }).eq("id", content.id)
    await admin.from("marketing_audit_logs").insert({ content_id: content.id, action: "render.completed", metadata: output })
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
    if (!["approved", "scheduled", "publishing"].includes(content.status)) {
      throw new Error("Publishing safety check failed: content is not approved.")
    }
    if (content.status === "scheduled" && (!content.proposedPublishAt || new Date(content.proposedPublishAt) > new Date())) {
      throw new Error("Publishing safety check failed: scheduled time has not arrived.")
    }
    const media = publishableAssets(content, assets)
    if (!media.length) throw new Error("Publishing safety check failed: approved publish media is missing.")

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
    if (!account) throw new Error("Publishing safety check failed: Instagram is not connected.")
    const accountRow = account as Row
    if (accountRow.token_expires_at && new Date(String(accountRow.token_expires_at)) <= new Date()) {
      await admin.from("marketing_accounts").update({ status: "expired" }).eq("id", accountRow.id as string)
      throw new Error("Instagram access token expired. Reconnect Instagram before publishing.")
    }

    const { data: existing, error: publicationError } = await admin
      .from("marketing_publications")
      .select("*")
      .eq("content_id", content.id)
      .maybeSingle()
    if (publicationError) throw publicationError
    const prior = record(existing)
    if (prior.status === "published") return { publicationId: prior.external_publication_id, duplicate: true }

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

    const withSignedUrls = await Promise.all(media.map(async asset => {
      if (!asset.storagePath) return asset
      const { data, error } = await admin.storage.from("marketing-assets").createSignedUrl(asset.storagePath, 60 * 60)
      if (error || !data?.signedUrl) throw error ?? new Error("Unable to sign rendered media for Instagram.")
      return { ...asset, signedUrl: data.signedUrl }
    }))
    const accessToken = TokenCryptoService.decrypt(String(accountRow.access_token_ciphertext))
    let containerId = publicationRow.external_container_id as string | null
    if (!containerId) {
      await admin.from("marketing_content").update({ status: "publishing" }).eq("id", content.id)
      const container = await InstagramService.createContainer({
        content,
        mediaAssets: withSignedUrls,
        accessToken,
        instagramAccountId: String(accountRow.external_account_id),
      })
      containerId = container.containerId
      await admin.from("marketing_publications").update({
        external_container_id: containerId,
        request_diagnostics: container.diagnostics,
        status: "processing",
      }).eq("id", publicationRow.id as string)
      await admin.from("marketing_audit_logs").insert({ content_id: content.id, action: "publication.container_created", metadata: { containerId } })
    }

    const containerStatus = await InstagramService.getContainerStatus(containerId, accessToken)
    if (containerStatus.status_code !== "FINISHED") {
      throw new Error(`Instagram media container is still processing (${String(containerStatus.status_code ?? "unknown")}).`)
    }
    if (publicationRow.publish_attempted_at) {
      throw new Error("A prior Instagram publish attempt has an unknown result; manual verification is required before retrying.")
    }

    await admin.from("marketing_publications").update({ publish_attempted_at: new Date().toISOString() }).eq("id", publicationRow.id as string)
    const published = await InstagramService.publishContainer({
      instagramAccountId: String(accountRow.external_account_id),
      accessToken,
      containerId,
    })
    const permalink = await InstagramService.getPublicationPermalink(published.publicationId, accessToken).catch(() => undefined)
    await admin.from("marketing_publications").update({
      external_publication_id: published.publicationId,
      permalink: permalink ?? null,
      request_diagnostics: published.diagnostics,
      status: "published",
      published_at: new Date().toISOString(),
      last_error: null,
    }).eq("id", publicationRow.id as string)
    await admin.from("marketing_content").update({ status: "published", published_at: new Date().toISOString(), last_error: null }).eq("id", content.id)
    await admin.from("marketing_audit_logs").insert({ content_id: content.id, action: "publication.succeeded", metadata: { publicationId: published.publicationId, permalink } })
    await admin.from("marketing_usage_events").insert({ content_id: content.id, category: "publishing", quantity: 1, unit: "attempt", metadata: { publicationId: published.publicationId } })
    return { publicationId: published.publicationId, permalink }
  }
}
