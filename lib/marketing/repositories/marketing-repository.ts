import { createServerSupabaseClient } from "@/lib/supabase/server"
import type {
  InstagramAccount,
  MarketingAsset,
  MarketingBrandSettings,
  MarketingContent,
  MarketingContentType,
  MarketingCampaign,
  CampaignPlanItem,
  MarketingJob,
  MarketingJobType,
  MarketingStatus,
  PropertyFactSnapshot,
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
  const assets = Array.isArray(row.marketing_content_assets)
    ? row.marketing_content_assets.map(object)
    : []

  const renderedAsset = assets.find(asset => asset.kind === "rendered_media")
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
    composition: object(row.composition),
    proposedPublishAt: row.proposed_publish_at as string | null,
    publishedAt: row.published_at as string | null,
    rejectionReason: row.rejection_reason as string | null,
    lastError: row.last_error as string | null,
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

export class MarketingRepository {
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
    return { content: mapContent({ ...row, marketing_content_assets: assets }), assets: assets.map(mapAsset) }
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
      assets: signedAssets.map(mapAsset),
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

  /** Deletes a draft and its generated private media; original property media is only referenced and is never removed. */
  static async deleteDraftContent(id: string) {
    const supabase = await createServerSupabaseClient()
    const { data: assets, error: assetsError } = await supabase
      .from("marketing_content_assets")
      .select("storage_path")
      .eq("content_id", id)
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
      .select("storage_path")
      .in("content_id", uniqueIds)
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
    })
    if (error) throw error
  }

  static async getInstagramAccount(): Promise<InstagramAccount | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("marketing_accounts")
      .select("id, username, display_name, account_type, profile_image_url, status, token_expires_at, scopes, connected_at, last_verified_at")
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
