import { createServerSupabaseClient } from "@/lib/supabase/server"
import type {
  InstagramAccount,
  MarketingAsset,
  MarketingAudioTrack,
  MarketingBrandAsset,
  MarketingBrandSettings,
  MarketingContent,
  MarketingContentType,
  MarketingCampaign,
  MarketingPublication,
  CampaignPlanItem,
  MarketingJob,
  MarketingJobType,
  MarketingStatus,
  PropertyFactSnapshot,
  MarketingReelVersion,
  ReelComposition,
} from "@/lib/marketing/types"

type Row = Record<string, unknown>

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : []
}

function mapContent(row: Row): MarketingContent {
  const property = object(row.properties)
  const assets = (Array.isArray(row.marketing_content_assets)
    ? row.marketing_content_assets.map(object)
    : []).sort((left, right) =>
      Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0) ||
      String(left.created_at ?? "").localeCompare(String(right.created_at ?? "")) ||
      String(left.id ?? "").localeCompare(String(right.id ?? ""))
    )

  const activeReelVersionId = row.active_reel_version_id as string | null
  const composition = object(row.composition)
  const renderToken = composition.renderToken as string | undefined
  const renderedAsset = assets.find(asset => asset.kind === "rendered_media" && (
    activeReelVersionId
      ? object(asset.metadata).reelVersionId === activeReelVersionId
      : renderToken
        ? object(asset.metadata).renderToken === renderToken
        : true
  ))
  const coverAsset = assets.find(asset => asset.kind === "cover")

  return {
    id: String(row.id),
    campaignId: row.campaign_id as string | null,
    accountId: row.account_id as string | null,
    primaryPropertyId: row.primary_property_id as string | null,
    propertySnapshot: object(row.property_snapshot),
    contentType: row.content_type as MarketingContentType,
    creativeDirection: String(row.creative_direction ?? "surprise_me"),
    title: row.title as string | null,
    status: row.status as MarketingStatus,
    caption: row.caption as string | null,
    shortCaption: row.short_caption as string | null,
    headline: row.headline as string | null,
    hook: row.hook as string | null,
    cta: row.cta as string | null,
    hashtags: stringArray(row.hashtags),
    altText: row.alt_text as string | null,
    creative: object(row.creative),
    composition,
    proposedPublishAt: row.proposed_publish_at as string | null,
    publishedAt: row.published_at as string | null,
    rejectionReason: row.rejection_reason as string | null,
    lastError: row.last_error as string | null,
    activeReelVersionId,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    propertyName:
      (property.name as string | null) ??
      (object(row.property_snapshot).title as string | null),
    propertyLocation:
      (property.location as string | null) ??
      (object(row.property_snapshot).location as string | null),
    coverUrl:
      (coverAsset?.source_url as string | null) ??
      (property.cover_image as string | null),
    renderedUrl: renderedAsset?.signed_url as string | null,
  }
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
    signedUrl: row.signed_url as string | null,
    metadata: object(row.metadata),
    sortOrder: Number(row.sort_order ?? 0),
    createdAt: String(row.created_at),
  }
}

function sortAssets<T extends MarketingAsset>(assets: T[]) {
  return [...assets].sort((left, right) =>
    left.sortOrder - right.sortOrder ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  )
}

function mapAudioTrack(row: Row, signedUrl?: string | null): MarketingAudioTrack {
  return {
    id: String(row.id),
    title: String(row.title),
    artistSource: row.artist_source as string | null,
    filename: String(row.filename),
    mimeType: row.mime_type as MarketingAudioTrack["mimeType"],
    fileSize: Number(row.file_size),
    durationSeconds: Number(row.duration_seconds),
    createdAt: String(row.created_at),
    createdBy: row.created_by as string | null,
    signedUrl: signedUrl ?? null,
  }
}

function mapBrandAsset(row: Row, signedUrl?: string | null): MarketingBrandAsset {
  return {
    id: String(row.id),
    kind: "logo",
    storagePath: String(row.storage_path),
    filename: String(row.filename),
    mimeType: row.mime_type as MarketingBrandAsset["mimeType"],
    width: typeof row.width === "number" ? row.width : null,
    height: typeof row.height === "number" ? row.height : null,
    active: Boolean(row.active),
    createdAt: String(row.created_at),
    createdBy: row.created_by as string | null,
    signedUrl: signedUrl ?? null,
  }
}

function mapReelVersion(row: Row): MarketingReelVersion {
  return {
    id: String(row.id),
    contentId: String(row.content_id),
    versionNumber: Number(row.version_number),
    status: row.status as MarketingReelVersion["status"],
    isCurrent: Boolean(row.is_current),
    composition: object(row.composition) as ReelComposition,
    sourceAssetIds: stringArray(row.source_asset_ids),
    logoSettings: object(row.logo_settings) as MarketingReelVersion["logoSettings"],
    audioSettings: object(row.audio_settings) as MarketingReelVersion["audioSettings"],
    renderedAssetId: row.rendered_asset_id as string | null,
    userPrompt: row.user_prompt as string | null,
    lastError: row.last_error as string | null,
    createdAt: String(row.created_at),
    createdBy: row.created_by as string | null,
    approvedAt: row.approved_at as string | null,
    renderedAt: row.rendered_at as string | null,
  }
}

function mapJob(row: Row): MarketingJob {
  return {
    id: String(row.id),
    contentId: row.content_id as string | null,
    type: row.type as MarketingJobType,
    status: row.status as MarketingJob["status"],
    progress: Number(row.progress ?? 0),
    input: object(row.input),
    output: object(row.output),
    error: row.error as string | null,
    attempts: Number(row.attempts ?? 0),
    maxAttempts: Number(row.max_attempts ?? 3),
    runAfter: String(row.run_after),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  }
}

function maskExternalAccountId(value: unknown) {
  const id = String(value ?? "")
  if (!id) return null
  if (id.length <= 6) return "••••"
  return `${id.slice(0, 3)}••••${id.slice(-3)}`
}

function mapPublication(row: Row): MarketingPublication {
  return {
    id: String(row.id),
    contentId: String(row.content_id),
    status: row.status as MarketingPublication["status"],
    instagramMediaId: row.external_publication_id as string | null,
    permalink: row.permalink as string | null,
    publishedAt: row.published_at as string | null,
    publishAttemptedAt: row.publish_attempted_at as string | null,
    lastError: row.last_error as string | null,
  }
}

function mapCampaign(row: Row): MarketingCampaign {
  const plan = Array.isArray(row.plan) ? row.plan : []
  return {
    id: String(row.id),
    title: String(row.title),
    objective: row.objective as string | null,
    status: row.status as MarketingCampaign["status"],
    durationDays: row.duration_days as number | null,
    postingFrequency: row.posting_frequency as number | null,
    plannedStartAt: row.planned_start_at as string | null,
    plannedEndAt: row.planned_end_at as string | null,
    plan: plan as CampaignPlanItem[],
    createdAt: String(row.created_at),
  }
}

async function signedAssetUrl(storagePath: string | null | undefined) {
  if (!storagePath) return null

  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.storage
    .from("marketing-assets")
    .createSignedUrl(storagePath, 60 * 20)

  return data?.signedUrl ?? null
}

async function signedBrandAssetUrl(storagePath: string | null | undefined) {
  if (!storagePath) return null
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.storage
    .from("marketing-brand-assets")
    .createSignedUrl(storagePath, 60 * 20)
  return data?.signedUrl ?? null
}

export class MarketingRepository {
  static async getActiveBrandLogo(): Promise<MarketingBrandAsset | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_brand_assets")
      .select("*")
      .eq("kind", "logo")
      .eq("active", true)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    const row = data as Row
    return mapBrandAsset(row, await signedBrandAssetUrl(String(row.storage_path)))
  }

  static async createBrandLogo(input: {
    storagePath: string
    filename: string
    mimeType: MarketingBrandAsset["mimeType"]
    width?: number | null
    height?: number | null
    createdBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    // Keep old files as inactive records so prior rendered versions remain
    // historically attributable even when the current logo is replaced.
    const { error: deactivateError } = await supabase
      .from("marketing_brand_assets")
      .update({ active: false })
      .eq("kind", "logo")
      .eq("active", true)
    if (deactivateError) throw deactivateError
    const { data, error } = await supabase
      .from("marketing_brand_assets")
      .insert({
        kind: "logo",
        storage_path: input.storagePath,
        filename: input.filename,
        mime_type: input.mimeType,
        width: input.width ?? null,
        height: input.height ?? null,
        active: true,
        created_by: input.createdBy,
      })
      .select("*")
      .single()
    if (error) throw error
    return mapBrandAsset(data as Row)
  }

  static async removeActiveBrandLogo() {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_brand_assets")
      .delete()
      .eq("kind", "logo")
      .eq("active", true)
      .select("id, storage_path")
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("No active brand logo was found.")
    return { id: String((data as Row).id), storagePath: String((data as Row).storage_path) }
  }

  static async listReelVersions(contentId: string): Promise<MarketingReelVersion[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_reel_versions")
      .select("*")
      .eq("content_id", contentId)
      .order("version_number", { ascending: false })
    if (error) throw error
    return ((data ?? []) as Row[]).map(mapReelVersion)
  }

  static async getReelVersion(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_reel_versions")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return data ? mapReelVersion(data as Row) : null
  }

  static async createReelVersion(input: {
    contentId: string
    composition: ReelComposition
    sourceAssetIds: string[]
    logoSettings?: ReelComposition["logo"] | null
    audioSettings?: ReelComposition["audio"] | null
    userPrompt?: string | null
    createdBy: string
    status?: MarketingReelVersion["status"]
    isCurrent?: boolean
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc("create_marketing_reel_version", {
      p_content_id: input.contentId,
      p_composition: input.composition,
      p_source_asset_ids: input.sourceAssetIds,
      p_logo_settings: input.logoSettings ?? null,
      p_audio_settings: input.audioSettings ?? null,
      p_user_prompt: input.userPrompt ?? null,
      p_created_by: input.createdBy,
      p_status: input.status ?? "draft",
      p_is_current: input.isCurrent ?? false,
    }).maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Reel version could not be created.")
    return mapReelVersion(data as Row)
  }

  static async approveNewestDraftReelVersion(contentId: string, adminId: string) {
    const supabase = await createServerSupabaseClient()
    const { data: version, error: versionError } = await supabase
      .from("marketing_reel_versions")
      .select("id")
      .eq("content_id", contentId)
      .eq("status", "draft")
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (versionError) throw versionError
    if (!version) return null
    const { data, error } = await supabase
      .from("marketing_reel_versions")
      .update({ status: "approved", approved_by: adminId, approved_at: new Date().toISOString(), last_error: null })
      .eq("id", (version as Row).id as string)
      .eq("status", "draft")
      .select("*")
      .maybeSingle()
    if (error) throw error
    return data ? mapReelVersion(data as Row) : null
  }

  /** Updates only an editable version. Rendered history is intentionally immutable. */
  static async updateDraftReelVersion(input: {
    id: string
    composition: ReelComposition
    audioSettings: ReelComposition["audio"]
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_reel_versions")
      .update({ composition: input.composition, audio_settings: input.audioSettings, last_error: null })
      .eq("id", input.id)
      .eq("status", "draft")
      .select("*")
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("The editable Reel draft is no longer available. Refresh and try again.")
    return mapReelVersion(data as Row)
  }

  static async markReelVersionRendering(id: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_reel_versions")
      .update({ status: "rendering", last_error: null })
      .eq("id", id)
      .eq("status", "approved")
    if (error) throw error
  }

  /**
   * Locks the approved parent and version, marks both rendering, and creates
   * the Railway job in one database transaction. A failed HTTP request cannot
   * leave a version approved while its parent is already rendering.
   */
  static async queueReelVersionRender(input: {
    contentId: string
    versionId: string
    updatedBy: string
    idempotencyKey: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc("queue_marketing_reel_version_render", {
        p_content_id: input.contentId,
        p_version_id: input.versionId,
        p_updated_by: input.updatedBy,
        p_idempotency_key: input.idempotencyKey,
      })
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Reel version render job could not be queued.")
    return mapJob(data as Row)
  }

  static async markReelVersionRendered(input: { id: string; renderedAssetId: string; makeCurrent?: boolean }) {
    const supabase = await createServerSupabaseClient()
    const { data: version, error: versionError } = await supabase
      .from("marketing_reel_versions").select("content_id").eq("id", input.id).maybeSingle()
    if (versionError) throw versionError
    if (!version) throw new Error("Reel version not found.")
    if (input.makeCurrent) {
      const { error } = await supabase.from("marketing_reel_versions")
        .update({ is_current: false })
        .eq("content_id", (version as Row).content_id as string)
        .eq("is_current", true)
      if (error) throw error
    }
    const { error } = await supabase.from("marketing_reel_versions").update({
      status: "rendered", rendered_asset_id: input.renderedAssetId, rendered_at: new Date().toISOString(),
      is_current: input.makeCurrent ?? false, last_error: null,
    }).eq("id", input.id)
    if (error) throw error
    if (input.makeCurrent) {
      const { error: contentError } = await supabase.from("marketing_content")
        .update({ active_reel_version_id: input.id })
        .eq("id", (version as Row).content_id as string)
      if (contentError) throw contentError
    }
  }

  static async failReelVersion(id: string, reason: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_reel_versions")
      .update({ status: "failed", last_error: reason.slice(0, 2000) })
      .eq("id", id)
    if (error) throw error
  }

  static async makeReelVersionCurrent(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("marketing_reel_versions")
      .select("content_id, composition").eq("id", id).eq("status", "rendered").maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Only a rendered Reel version can be made current.")
    const contentId = String((data as Row).content_id)
    const { error: clearError } = await supabase.from("marketing_reel_versions")
      .update({ is_current: false }).eq("content_id", contentId).eq("is_current", true)
    if (clearError) throw clearError
    const { error: setError } = await supabase.from("marketing_reel_versions").update({ is_current: true }).eq("id", id)
    if (setError) throw setError
    const { error: contentError } = await supabase.from("marketing_content")
      .update({ active_reel_version_id: id, composition: (data as Row).composition })
      .eq("id", contentId)
    if (contentError) throw contentError
  }

  static async deleteDraftReelVersion(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("marketing_reel_versions")
      .delete().eq("id", id).eq("status", "draft").eq("is_current", false).select("id").maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Only an unused draft Reel version can be deleted.")
  }
  static async listAudioTracks(): Promise<MarketingAudioTrack[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_audio_tracks")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error

    return Promise.all(((data ?? []) as Row[]).map(async row => {
      const { data: signed } = await supabase.storage
        .from("marketing-audio")
        .createSignedUrl(String(row.storage_path), 60 * 20)
      return mapAudioTrack(row, signed?.signedUrl ?? null)
    }))
  }

  static async createAudioTrack(input: {
    title: string
    artistSource?: string | null
    storagePath: string
    filename: string
    mimeType: MarketingAudioTrack["mimeType"]
    fileSize: number
    durationSeconds: number
    createdBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_audio_tracks")
      .insert({
        title: input.title,
        artist_source: input.artistSource ?? null,
        storage_path: input.storagePath,
        filename: input.filename,
        mime_type: input.mimeType,
        file_size: input.fileSize,
        duration_seconds: input.durationSeconds,
        created_by: input.createdBy,
      })
      .select("*")
      .single()
    if (error) throw error
    return mapAudioTrack(data as Row)
  }

  static async updateAudioTrack(id: string, input: { title: string; artistSource?: string | null }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_audio_tracks")
      .update({ title: input.title, artist_source: input.artistSource ?? null })
      .eq("id", id)
      .select("*")
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Audio track not found.")
    return mapAudioTrack(data as Row)
  }

  static async getAudioTrackById(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_audio_tracks")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) throw error
    return data ? mapAudioTrack(data as Row) : null
  }

  /** Used by signed-upload finalization to make client retries idempotent. */
  static async getAudioTrackByStoragePath(storagePath: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_audio_tracks")
      .select("*")
      .eq("storage_path", storagePath)
      .maybeSingle()
    if (error) throw error
    return data ? mapAudioTrack(data as Row) : null
  }

  static async deleteAudioTrack(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_audio_tracks")
      .delete()
      .eq("id", id)
      .select("id, storage_path")
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Audio track not found.")
    const row = data as Row
    return { id: String(row.id), storagePath: String(row.storage_path) }
  }

  static async getContentByIdempotencyKey(idempotencyKey: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_content")
      .select(`
        *,
        properties (name, location, cover_image),
        marketing_content_assets (*)
      `)
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle()
    if (error) throw error
    if (!data) return null
    const row = data as Row
    const assets = Array.isArray(row.marketing_content_assets)
      ? row.marketing_content_assets.map(object).map(asset => ({ ...asset, signed_url: null }))
      : []
    const mappedAssets = sortAssets(assets.map(mapAsset))
    return { content: mapContent({ ...row, marketing_content_assets: assets }), assets: mappedAssets }
  }

  static async listContent(options?: {
    status?: MarketingStatus
    limit?: number
    propertyId?: string
    search?: string
  }) {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from("marketing_content")
      .select(`
        *,
        properties (name, location, cover_image),
        marketing_content_assets (id, kind, storage_path, source_url)
      `)
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 60)

    if (options?.status) query = query.eq("status", options.status)
    if (options?.propertyId) query = query.eq("primary_property_id", options.propertyId)
    if (options?.search) query = query.ilike("title", `%${options.search}%`)

    const { data, error } = await query
    if (error) throw error

    const rows = (data ?? []) as Row[]
    const withSignedUrls = await Promise.all(rows.map(async row => {
      const assets = Array.isArray(row.marketing_content_assets)
        ? row.marketing_content_assets.map(object)
        : []
      const signedAssets = await Promise.all(assets.map(async asset => ({
        ...asset,
        signed_url: await signedAssetUrl(asset.storage_path as string | null),
      })))

      return mapContent({ ...row, marketing_content_assets: signedAssets })
    }))

    return withSignedUrls
  }

  static async getContentById(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_content")
      .select(`
        *,
        properties (name, location, cover_image),
        marketing_content_assets (*)
      `)
      .eq("id", id)
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    const row = data as Row
    const assets = Array.isArray(row.marketing_content_assets)
      ? row.marketing_content_assets.map(object)
      : []
    const signedAssets = await Promise.all(assets.map(async asset => ({
      ...asset,
      signed_url: await signedAssetUrl(asset.storage_path as string | null),
    })))

    return {
      content: mapContent({ ...row, marketing_content_assets: signedAssets }),
      assets: sortAssets(signedAssets.map(mapAsset)),
    }
  }

  static async createContent(input: {
    contentType: MarketingContentType
    creativeDirection: string
    property: PropertyFactSnapshot
    accountId?: string | null
    createdBy: string
    idempotencyKey: string
    title?: string
    campaignId?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_content")
      .insert({
        content_type: input.contentType,
        creative_direction: input.creativeDirection,
        primary_property_id: input.property.id,
        property_snapshot: input.property,
        account_id: input.accountId ?? null,
        campaign_id: input.campaignId ?? null,
        title: input.title ?? `${input.property.title} · ${input.contentType.replaceAll("_", " ")}`,
        created_by: input.createdBy,
        updated_by: input.createdBy,
        idempotency_key: input.idempotencyKey,
      })
      .select("*")
      .single()

    if (error) throw error
    return mapContent(data as Row)
  }

  static async addSourceAssets(contentId: string, property: PropertyFactSnapshot) {
    if (!property.media.length) return []

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_content_assets")
      .insert(property.media.map((media, sortOrder) => ({
        content_id: contentId,
        property_image_id: media.id,
        kind: "original_reference",
        media_type: media.type,
        source_url: media.url,
        sort_order: sortOrder,
        metadata: { isCover: media.isCover },
      })))
      .select("*")

    if (error) throw error
    return ((data ?? []) as Row[]).map(mapAsset)
  }

  static async updateContent(
    id: string,
    changes: Record<string, unknown>,
    updatedBy: string
  ) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_content")
      .update({ ...changes, updated_by: updatedBy })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw error
    return mapContent(data as Row)
  }

  /**
   * The database function locks the content record, validates that every
   * requested image belongs to its source property, and resets approval in
   * the same transaction. It never edits the CRM property gallery itself.
   */
  static async updateCarouselMedia(input: {
    contentId: string
    propertyImageIds: string[]
    updatedBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc("update_marketing_carousel_media", {
      p_content_id: input.contentId,
      p_property_image_ids: input.propertyImageIds,
      p_updated_by: input.updatedBy,
    }).maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Carousel media could not be updated.")
    return mapContent(data as Row)
  }

  static async listPropertyGalleryImages(propertyId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("property_images")
      .select("id, url, is_cover")
      .eq("property_id", propertyId)
      .eq("media_type", "image")
      .order("created_at", { ascending: true })
    if (error) throw error
    return ((data ?? []) as Row[]).map(image => ({
      id: String(image.id),
      url: String(image.url),
      isCover: Boolean(image.is_cover),
    }))
  }

  /** Deletes a draft and its generated private media; original property media is only referenced and is never removed. */
  static async deleteDraftContent(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data: assets, error: assetsError } = await supabase
      .from("marketing_content_assets")
      .select("storage_path, kind")
      .eq("content_id", id)
      .in("kind", ["working_composition", "rendered_media", "cover", "audio"])
      .not("storage_path", "is", null)
    if (assetsError) throw assetsError

    const { data, error } = await supabase
      .from("marketing_content")
      .delete()
      .eq("id", id)
      .eq("status", "draft")
      .select("id")
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Only draft content can be deleted.")

    const paths = ((assets ?? []) as Row[])
      .map(asset => asset.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0)
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("marketing-assets").remove(paths)
      if (storageError) console.warn("Draft content was deleted but generated media cleanup failed:", storageError.message)
    }
  }

  /** Bulk counterpart to deleteDraftContent. The status preflight prevents partial deletion of mixed selections. */
  static async deleteDraftContents(ids: string[]) {
    const uniqueIds = [...new Set(ids)]
    const supabase = await createServerSupabaseClient()
    const { data: records, error: recordsError } = await supabase
      .from("marketing_content")
      .select("id, status")
      .in("id", uniqueIds)
    if (recordsError) throw recordsError

    const found = (records ?? []) as Row[]
    const ineligible = found.filter(record => record.status !== "draft").map(record => String(record.id))
    if (found.length !== uniqueIds.length || ineligible.length) {
      throw new Error("Only draft content can be deleted. Clear any ineligible items and try again.")
    }

    const { data: assets, error: assetsError } = await supabase
      .from("marketing_content_assets")
      .select("storage_path, kind")
      .in("content_id", uniqueIds)
      .in("kind", ["working_composition", "rendered_media", "cover", "audio"])
      .not("storage_path", "is", null)
    if (assetsError) throw assetsError

    const { data: deleted, error: deleteError } = await supabase
      .from("marketing_content")
      .delete()
      .in("id", uniqueIds)
      .eq("status", "draft")
      .select("id")
    if (deleteError) throw deleteError
    if ((deleted ?? []).length !== uniqueIds.length) {
      throw new Error("One or more drafts changed before deletion. Refresh and try again.")
    }

    const paths = ((assets ?? []) as Row[])
      .map(asset => asset.storage_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0)
    if (paths.length) {
      const { error: storageError } = await supabase.storage.from("marketing-assets").remove(paths)
      if (storageError) console.warn("Drafts were deleted but generated media cleanup failed:", storageError.message)
    }
    return (deleted ?? []).map(row => String((row as Row).id))
  }

  /**
   * Uses a row-locking database function so a stale selected card can never
   * unschedule or delete content that has already started publishing.
   */
  static async manageScheduledContents(input: {
    ids: string[]
    action: "unschedule" | "delete"
    updatedBy: string
  }) {
    const uniqueIds = [...new Set(input.ids)]
    const supabase = await createServerSupabaseClient()
    // Only Marketing-owned derivative paths are candidates for cleanup. The
    // original CRM images/videos are source_url references and are excluded.
    const { data: ownedAssets, error: assetError } = input.action === "delete"
      ? await supabase.from("marketing_content_assets")
        .select("content_id, storage_path, kind")
        .in("content_id", uniqueIds)
        .in("kind", ["working_composition", "rendered_media", "cover", "audio"])
        .not("storage_path", "is", null)
      : { data: [], error: null }
    if (assetError) throw assetError

    const { data, error } = await supabase.rpc("manage_scheduled_marketing_content", {
      p_ids: uniqueIds,
      p_action: input.action,
      p_updated_by: input.updatedBy,
    })
    if (error) {
      const diagnostic = {
        code: typeof error.code === "string" ? error.code : "unknown",
        message: String(error.message ?? "Scheduled-content RPC failed.")
          .replace(/https?:\/\/[^\s]+/gi, "[url]")
          .replace(/\b(token|key|secret|signature)\b\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
          .slice(0, 500),
      }
      console.error("Marketing scheduled-content RPC failed:", JSON.stringify(diagnostic))
      if (diagnostic.code === "PGRST202" || diagnostic.code === "42883") {
        throw new Error("Scheduled-content controls are unavailable. Apply the latest Supabase migration and retry.")
      }
      if (diagnostic.code === "42501") throw new Error("You do not have permission to update scheduled Marketing content.")
      throw new Error("Scheduled-content action failed in the database. Refresh and retry; if it continues, contact an administrator.")
    }
    const outcomes = ((data ?? []) as Row[]).map(row => ({
      id: String(row.content_id),
      outcome: String(row.outcome),
    }))
    const deletedIds = outcomes.filter(item => item.outcome === "deleted").map(item => item.id)
    if (input.action === "delete" && deletedIds.length) {
      const paths = ((ownedAssets ?? []) as Row[])
        .filter(asset => deletedIds.includes(String(asset.content_id)))
        .map(asset => asset.storage_path)
        .filter((path): path is string => typeof path === "string" && path.length > 0)
      if (paths.length) {
        const { error: storageError } = await supabase.storage.from("marketing-assets").remove(paths)
        if (storageError) console.warn("Scheduled content was deleted but derived-media cleanup failed:", storageError.message)
      }
    }
    return outcomes
  }

  static async transitionContent(input: {
    id: string
    from: MarketingStatus | MarketingStatus[]
    to: MarketingStatus
    updatedBy: string
    changes?: Record<string, unknown>
  }) {
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from("marketing_content")
      .update({ status: input.to, updated_by: input.updatedBy, ...(input.changes ?? {}) })
      .eq("id", input.id)

    query = Array.isArray(input.from)
      ? query.in("status", input.from)
      : query.eq("status", input.from)

    const { data, error } = await query.select("*").maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Content is not in a valid state for this action.")
    return mapContent(data as Row)
  }

  /** Writes the content state, approval decision, Reel-version approval, and audit event atomically. */
  static async applyApproval(input: {
    contentId: string
    decision: "approved" | "changes_requested" | "rejected"
    note?: string
    decidedBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc("apply_marketing_approval", {
      p_content_id: input.contentId,
      p_decision: input.decision,
      p_note: input.note ?? null,
      p_decided_by: input.decidedBy,
    }).maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Approval could not be recorded.")
    return mapContent(data as Row)
  }

  static async addAsset(input: {
    contentId: string
    kind: MarketingAsset["kind"]
    mediaType: MarketingAsset["mediaType"]
    storagePath?: string
    sourceUrl?: string
    metadata?: Record<string, unknown>
    sortOrder?: number
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_content_assets")
      .insert({
        content_id: input.contentId,
        kind: input.kind,
        media_type: input.mediaType,
        storage_path: input.storagePath ?? null,
        source_url: input.sourceUrl ?? null,
        metadata: input.metadata ?? {},
        sort_order: input.sortOrder ?? 0,
      })
      .select("*")
      .single()

    if (error) throw error
    return mapAsset(data as Row)
  }

  static async enqueueJob(input: {
    contentId: string
    type: MarketingJobType
    input?: Record<string, unknown>
    idempotencyKey: string
    runAfter?: string
    maxAttempts?: number
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_jobs")
      .upsert({
        content_id: input.contentId,
        type: input.type,
        input: input.input ?? {},
        idempotency_key: input.idempotencyKey,
        run_after: input.runAfter ?? new Date().toISOString(),
        max_attempts: input.maxAttempts ?? 3,
      }, { onConflict: "idempotency_key", ignoreDuplicates: true })
      .select("*")
      .maybeSingle()

    if (error) throw error
    return data ? mapJob(data as Row) : null
  }

  /**
   * Transitions an approved Reel and inserts its runnable job in one database
   * transaction. This prevents a queue write failure from stranding content in
   * `rendering` with nothing for Railway to claim.
   */
  static async queueReelRender(input: {
    contentId: string
    updatedBy: string
    idempotencyKey: string
    jobInput?: Record<string, unknown>
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .rpc("queue_marketing_reel_render", {
        p_content_id: input.contentId,
        p_updated_by: input.updatedBy,
        p_idempotency_key: input.idempotencyKey,
        p_input: input.jobInput ?? {},
      })
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error("Render job could not be queued.")
    return mapJob(data as Row)
  }

  static async claimRunnableJobs(workerId: string, limit = 5) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_jobs")
      .select("*")
      .eq("status", "queued")
      .lte("run_after", new Date().toISOString())
      .order("created_at", { ascending: true })
      .limit(limit)

    if (error) throw error

    const claimed: MarketingJob[] = []
    for (const candidate of (data ?? []) as Row[]) {
      const { data: job, error: claimError } = await supabase
        .from("marketing_jobs")
        .update({
          status: "running",
          locked_at: new Date().toISOString(),
          locked_by: workerId,
          attempts: Number(candidate.attempts ?? 0) + 1,
          progress: 5,
        })
        .eq("id", candidate.id as string)
        .eq("status", "queued")
        .select("*")
        .maybeSingle()

      if (claimError) throw claimError
      if (job) claimed.push(mapJob(job as Row))
    }

    return claimed
  }

  static async completeJob(id: string, output: Record<string, unknown>) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from("marketing_jobs")
      .update({ status: "completed", progress: 100, output, error: null })
      .eq("id", id)
    if (error) throw error
  }

  static async failJob(id: string, errorMessage: string, attempts: number, maxAttempts: number) {
    const supabase = await createServerSupabaseClient()
    const retry = attempts < maxAttempts
    const { error } = await supabase
      .from("marketing_jobs")
      .update({
        status: retry ? "queued" : "failed",
        error: errorMessage.slice(0, 2000),
        run_after: new Date(Date.now() + Math.min(30, 2 ** attempts) * 60_000).toISOString(),
        locked_at: null,
        locked_by: null,
      })
      .eq("id", id)
    if (error) throw error
  }

  static async addAuditLog(input: {
    actorId?: string | null
    contentId?: string | null
    action: string
    metadata?: Record<string, unknown>
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_audit_logs").insert({
      actor_id: input.actorId ?? null,
      content_id: input.contentId ?? null,
      action: input.action,
      metadata: input.metadata ?? {},
    })
    if (error) throw error
  }

  static async addApproval(input: {
    contentId: string
    decision: "approved" | "changes_requested" | "rejected"
    note?: string
    decidedBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_approvals").insert({
      content_id: input.contentId,
      decision: input.decision,
      note: input.note ?? null,
      decided_by: input.decidedBy,
    })
    if (error) throw error
  }

  static async upsertSchedule(input: {
    contentId: string
    scheduledFor: string
    timezone: string
    createdBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_schedules").upsert({
      content_id: input.contentId,
      scheduled_for: input.scheduledFor,
      timezone: input.timezone,
      created_by: input.createdBy,
    }, { onConflict: "content_id" })
    if (error) throw error
  }

  /**
   * The database locks the approved item and writes its schedule, queued
   * publish job, and audit event in one transaction. This prevents an
   * otherwise-valid Carousel from remaining approved after a partial write.
   */
  static async scheduleApprovedContent(input: {
    contentId: string
    scheduledFor: string
    timezone: string
    createdBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc("schedule_marketing_content", {
      p_content_id: input.contentId,
      p_scheduled_for: input.scheduledFor,
      p_timezone: input.timezone,
      p_created_by: input.createdBy,
    }).maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Scheduled publishing job could not be created.")
    return mapContent(data as Row)
  }

  static async recordUsage(input: {
    contentId?: string
    category: "ai_generation" | "image_generation" | "video_render" | "storage" | "publishing"
    quantity?: number
    unit: string
    metadata?: Record<string, unknown>
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_usage_events").insert({
      content_id: input.contentId ?? null,
      category: input.category,
      quantity: input.quantity ?? 1,
      unit: input.unit,
      metadata: input.metadata ?? {},
    })
    if (error) throw error
  }

  static async getBrandSettings(): Promise<MarketingBrandSettings> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_brand_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle()

    if (error) throw error
    const row = object(data)
    return {
      brandName: row.brand_name as string | null,
      instagramHandle: row.instagram_handle as string | null,
      website: row.website as string | null,
      whatsappCta: row.whatsapp_cta as string | null,
      preferredTone: String(row.preferred_tone ?? "Premium, sophisticated, aspirational luxury real estate."),
      preferredCta: row.preferred_cta as string | null,
      defaultHashtags: stringArray(row.default_hashtags),
      excludedWords: stringArray(row.excluded_words),
      fontFamily: row.font_family as string | null,
      brandColors: object(row.brand_colors) as MarketingBrandSettings["brandColors"],
      timezone: String(row.timezone ?? "Asia/Kolkata"),
      defaultReelLogoPlacement: (row.default_reel_logo_placement as MarketingBrandSettings["defaultReelLogoPlacement"]) ?? "none",
      defaultReelLogoOpacity: Number(row.default_reel_logo_opacity ?? 0.65),
      defaultReelLogoScale: (row.default_reel_logo_scale as MarketingBrandSettings["defaultReelLogoScale"]) ?? "small",
    }
  }

  static async upsertBrandSettings(settings: Partial<MarketingBrandSettings>) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_brand_settings").upsert({
      id: true,
      brand_name: settings.brandName ?? null,
      instagram_handle: settings.instagramHandle ?? null,
      website: settings.website ?? null,
      whatsapp_cta: settings.whatsappCta ?? null,
      preferred_tone: settings.preferredTone,
      preferred_cta: settings.preferredCta ?? null,
      default_hashtags: settings.defaultHashtags ?? [],
      excluded_words: settings.excludedWords ?? [],
      font_family: settings.fontFamily ?? null,
      brand_colors: settings.brandColors ?? {},
      timezone: settings.timezone ?? "Asia/Kolkata",
      default_reel_logo_placement: settings.defaultReelLogoPlacement ?? "none",
      default_reel_logo_opacity: settings.defaultReelLogoOpacity ?? 0.65,
      default_reel_logo_scale: settings.defaultReelLogoScale ?? "small",
    })
    if (error) throw error
  }

  static async getInstagramAccount(): Promise<InstagramAccount | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_accounts")
      .select("id, external_account_id, username, display_name, account_type, profile_image_url, status, token_expires_at, scopes, connected_at, last_verified_at")
      .eq("platform", "instagram")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!data) return null
    const row = data as Row
    const expiresAt = row.token_expires_at as string | null
    const expiresAtValue = expiresAt ? new Date(expiresAt).valueOf() : null
    const sevenDaysFromNow = Date.now() + 7 * 86_400_000
    const storedStatus = row.status as InstagramAccount["status"]
    const status = expiresAtValue && expiresAtValue <= Date.now()
      ? "expired"
      : storedStatus === "connected" && expiresAtValue && expiresAtValue <= sevenDaysFromNow
        ? "expiring"
        : storedStatus

    return {
      id: String(row.id),
      maskedAccountId: maskExternalAccountId(row.external_account_id),
      username: row.username as string | null,
      displayName: row.display_name as string | null,
      accountType: row.account_type as string | null,
      profileImageUrl: row.profile_image_url as string | null,
      status,
      tokenExpiresAt: expiresAt,
      connectedAt: row.connected_at as string | null,
      lastVerifiedAt: row.last_verified_at as string | null,
      scopes: stringArray(row.scopes),
    }
  }

  static async upsertInstagramAccount(input: {
    externalAccountId: string
    username?: string
    displayName?: string
    accountType?: string
    profileImageUrl?: string
    accessTokenCiphertext: string
    tokenExpiresAt?: string
    scopes: string[]
    connectedBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    const values = {
      external_account_id: input.externalAccountId,
      username: input.username ?? null,
      display_name: input.displayName ?? null,
      account_type: input.accountType ?? null,
      profile_image_url: input.profileImageUrl ?? null,
      access_token_ciphertext: input.accessTokenCiphertext,
      token_expires_at: input.tokenExpiresAt ?? null,
      scopes: input.scopes,
      status: "connected",
      connected_by: input.connectedBy,
      connected_at: new Date().toISOString(),
      last_verified_at: new Date().toISOString(),
    }
    const { data: existing, error: existingError } = await supabase
      .from("marketing_accounts")
      .select("id")
      .eq("platform", "instagram")
      .maybeSingle()
    if (existingError) throw existingError
    const { error } = existing
      ? await supabase.from("marketing_accounts").update(values).eq("id", (existing as Row).id as string)
      : await supabase.from("marketing_accounts").insert({ platform: "instagram", ...values })
    if (error) throw error
  }

  static async disconnectInstagramAccount() {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase
      .from("marketing_accounts")
      .update({ status: "disconnected", access_token_ciphertext: "disconnected" })
      .eq("platform", "instagram")
      .in("status", ["connected", "expiring", "expired", "error", "revoked"])
    if (error) throw error

    const { error: blockedError } = await supabase
      .from("marketing_content")
      .update({ status: "blocked_connection", last_error: "Instagram needs to be reconnected before this post can publish." })
      .eq("status", "scheduled")
    if (blockedError) throw blockedError
    const { error: cancelledError } = await supabase
      .from("marketing_jobs")
      .update({ status: "cancelled", error: "Instagram disconnected before scheduled publishing." })
      .eq("type", "publish_instagram")
      .eq("status", "queued")
    if (cancelledError) throw cancelledError
  }

  static async getInstagramAccountSecret() {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_accounts")
      .select("id, external_account_id, access_token_ciphertext, status, scopes, token_expires_at")
      .eq("platform", "instagram")
      .maybeSingle()
    if (error) throw error
    return data ? object(data) : null
  }

  /** Publication data that is safe for an authenticated Marketing admin UI. */
  static async getPublicationForContent(contentId: string): Promise<MarketingPublication | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_publications")
      .select("id, content_id, status, external_publication_id, permalink, publish_attempted_at, published_at, last_error")
      .eq("content_id", contentId)
      .maybeSingle()
    if (error) throw error
    return data ? mapPublication(data as Row) : null
  }

  /**
   * A retry is only safe before media_publish was attempted. Once Meta may
   * have accepted that request, the worker deliberately requires manual
   * verification instead of risking a duplicate Instagram post.
   */
  static async prepareSafePublicationRetry(input: { contentId: string; updatedBy: string }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc("recover_marketing_publication", {
      p_content_id: input.contentId,
      p_updated_by: input.updatedBy,
    }).maybeSingle()
    if (error) throw error
    if (!data) throw new Error("This publication cannot be retried automatically. Verify Instagram before creating a new attempt.")
    return mapContent(data as Row)
  }

  /** Returns only a known-safe failed publication to Approved; it never queues Meta work. */
  static async returnPublicationToApproved(input: { contentId: string; updatedBy: string }) {
    return this.prepareSafePublicationRetry(input)
  }

  static async updateInstagramConnectionHealth(input: {
    status: InstagramAccount["status"]
    lastVerifiedAt?: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_accounts").update({
      status: input.status,
      last_verified_at: input.lastVerifiedAt ?? new Date().toISOString(),
    }).eq("platform", "instagram")
    if (error) throw error
  }

  static async createOAuthState(input: {
    stateHash: string
    userId: string
    returnTo: string
    expiresAt: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_oauth_states").insert({
      state_hash: input.stateHash,
      user_id: input.userId,
      return_to: input.returnTo,
      expires_at: input.expiresAt,
    })
    if (error) throw error
  }

  static async consumeOAuthState(input: { stateHash: string; userId: string }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_oauth_states")
      .update({ used_at: new Date().toISOString() })
      .eq("state_hash", input.stateHash)
      .eq("user_id", input.userId)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .select("return_to")
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Expired or already used Instagram OAuth state.")
    return object(data).return_to as string
  }

  static async getPropertySnapshot(propertyId: string): Promise<PropertyFactSnapshot | null> {
    const supabase = await createServerSupabaseClient()
    const { data: property, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .maybeSingle()
    if (error) throw error
    if (!property) return null

    const row = property as Row
    const { data: images, error: imageError } = await supabase
      .from("property_images")
      .select("id, url, media_type, is_cover")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true })
    if (imageError) throw imageError

    const price = object(row.price)
    const asking = price.asking ?? price.rent
    const specifications = object(row.specifications)
    const snapshot: PropertyFactSnapshot = {
      id: String(row.id),
      title: String(row.name ?? ""),
      location: row.location as string | undefined,
      locality: row.locality as string | undefined,
      price: typeof asking === "number" || typeof asking === "string" ? String(asking) : undefined,
      bedrooms: Number(row.bedrooms ?? specifications.bedrooms) || undefined,
      bathrooms: Number(row.bathrooms ?? specifications.bathrooms) || undefined,
      carpetArea: Number(row.carpet_area ?? specifications.carpetArea) || undefined,
      builtUpArea: Number(row.built_up_area ?? specifications.builtUpArea) || undefined,
      plotArea: Number(row.plot_area ?? specifications.plotArea) || undefined,
      description: row.description as string | undefined,
      amenities: stringArray(row.amenities),
      features: stringArray(row.tags),
      propertyType: row.property_type as string | undefined,
      developmentStage: row.development_stage as string | undefined,
      status: row.status as string | undefined,
      marketingPriority: row.marketing_priority as PropertyFactSnapshot["marketingPriority"],
      media: ((images ?? []) as Row[]).map(image => ({
        id: String(image.id),
        url: String(image.url),
        type: image.media_type === "video" ? "video" : "image",
        isCover: Boolean(image.is_cover),
      })),
    }

    return snapshot
  }

  static async getDashboardData() {
    const content = await this.listContent({ limit: 12 })
    const counts = content.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.status] = (accumulator[item.status] ?? 0) + 1
      return accumulator
    }, {})
    const [account, settings] = await Promise.all([
      this.getInstagramAccount(),
      this.getBrandSettings(),
    ])

    return { content, counts, account, settings }
  }

  static async createCampaign(input: {
    title: string
    objective?: string
    creativeDirection: string
    durationDays: number
    postingFrequency: number
    plannedStartAt: string
    plannedEndAt: string
    plan: CampaignPlanItem[]
    properties: PropertyFactSnapshot[]
    createdBy: string
  }) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("marketing_campaigns").insert({
      title: input.title,
      objective: input.objective ?? null,
      creative_direction: input.creativeDirection,
      status: "plan_ready",
      duration_days: input.durationDays,
      posting_frequency: input.postingFrequency,
      planned_start_at: input.plannedStartAt,
      planned_end_at: input.plannedEndAt,
      plan: input.plan,
      created_by: input.createdBy,
    }).select("*").single()
    if (error) throw error
    const campaign = mapCampaign(data as Row)
    const propertyMap = new Map(input.properties.map(property => [property.id, property]))
    const { error: itemError } = await supabase.from("marketing_campaign_items").insert(input.plan.map((item, position) => ({
      campaign_id: campaign.id,
      property_id: item.propertyId,
      property_snapshot: propertyMap.get(item.propertyId) ?? {},
      content_type: item.contentType,
      creative_direction: item.creativeDirection,
      hook: item.hook,
      planned_for: item.plannedFor,
      position,
    })))
    if (itemError) throw itemError
    return campaign
  }

  static async listCampaigns(): Promise<MarketingCampaign[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false })
    if (error) throw error
    return ((data ?? []) as Row[]).map(mapCampaign)
  }

  static async getCampaign(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("marketing_campaigns").select("*, marketing_campaign_items (*)").eq("id", id).maybeSingle()
    if (error) throw error
    if (!data) return null
    return { campaign: mapCampaign(data as Row), items: (Array.isArray((data as Row).marketing_campaign_items) ? (data as Row).marketing_campaign_items : []) as Row[] }
  }

  static async approveCampaignPlan(id: string, adminId: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update({ status: "generating" })
      .eq("id", id)
      .eq("status", "plan_ready")
      .select("*")
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error("Campaign plan is not ready for approval.")
    await this.addAuditLog({ actorId: adminId, action: "campaign.plan_approved", metadata: { campaignId: id } })
    return mapCampaign(data as Row)
  }

  static async getCampaignItems(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("marketing_campaign_items").select("*").eq("campaign_id", id).order("position")
    if (error) throw error
    return (data ?? []) as Row[]
  }

  static async linkCampaignItem(itemId: string, contentId: string) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_campaign_items").update({ content_id: contentId, status: "generating" }).eq("id", itemId)
    if (error) throw error
  }

  static async updateCampaignStatus(id: string, status: MarketingCampaign["status"]) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.from("marketing_campaigns").update({ status }).eq("id", id)
    if (error) throw error
  }
}
