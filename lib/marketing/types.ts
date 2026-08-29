export const MARKETING_CONTENT_TYPES = [
  "reel",
  "single_image",
  "carousel",
  "story",
  "infographic",
  "property_spotlight",
  "new_listing",
  "price_update",
  "just_listed",
  "luxury_lifestyle",
  "investment_opportunity",
  "location_spotlight",
  "feature_highlight",
  "architecture_highlight",
  "construction_update",
  "inventory_roundup",
  "property_comparison",
] as const

export type MarketingContentType =
  (typeof MARKETING_CONTENT_TYPES)[number]

/**
 * The delivery surface is deliberately distinct from the legacy database
 * content type. New content always persists one of these values in its
 * versioned Marketing contract; legacy content types remain readable history.
 */
export const MARKETING_FORMATS = [
  "feed_single",
  "carousel",
  "story",
  "reel",
] as const

export type MarketingFormat = (typeof MARKETING_FORMATS)[number]

export const MARKETING_OBJECTIVES = [
  "new_listing",
  "property_spotlight",
  "architecture",
  "interiors",
  "amenities_features",
  "lifestyle",
  "location",
  "investment",
  "price_update",
  "availability",
  "construction_update",
  "open_house",
  "recently_sold",
  "brand_editorial",
] as const

export type MarketingObjective = (typeof MARKETING_OBJECTIVES)[number]

export type MarketingMediaSelection = {
  mode: "automatic" | "curated"
  assetIds: string[]
}

export type MarketingBrandTreatment = {
  version: "v1"
  logo: {
    enabled: boolean
    assetId: string | null
    placement: "none" | "top_left" | "top_right" | "bottom_left" | "bottom_right" | "end_card_only"
    scale: "small" | "medium" | "large"
    opacity: number
  }
}

/** Persisted inside composition so it is versioned with render inputs. */
export type MarketingContentContract = {
  version: "v2"
  format: MarketingFormat
  objective: MarketingObjective
  creativeDirection: "luxury_editorial"
  mediaSelection: MarketingMediaSelection
  brandTreatment: MarketingBrandTreatment
}

export const MARKETING_STATUSES = [
  "draft",
  "rendering",
  "ready_for_review",
  "changes_requested",
  "approved",
  "scheduled",
  "publishing",
  "published",
  "blocked_connection",
  "failed",
] as const

export type MarketingStatus = (typeof MARKETING_STATUSES)[number]

export const CREATIVE_DIRECTIONS = [
  "luxury_editorial",
  "cinematic",
  "minimal",
  "investment_focused",
  "lifestyle",
  "architecture_focused",
  "tropical_goa",
  "high_energy_reel",
  "elegant_slow_reel",
  "surprise_me",
] as const

export type CreativeDirection = (typeof CREATIVE_DIRECTIONS)[number]

export type MarketingAsset = {
  id: string
  contentId: string
  propertyImageId?: string | null
  kind: "original_reference" | "working_composition" | "rendered_media" | "cover" | "audio"
  mediaType: "image" | "video" | "audio" | "document"
  storagePath?: string | null
  sourceUrl?: string | null
  signedUrl?: string | null
  metadata: Record<string, unknown>
  sortOrder: number
  createdAt: string
}

/** A capability record captured by ingestion/probing when it is available. */
export type MarketingMediaCapability = {
  assetId: string
  propertyId?: string | null
  declaredMediaType: "image" | "video" | "audio" | "document"
  probedMediaType?: "image" | "video"
  mimeType?: string
  width?: number
  height?: number
  aspectRatio?: number
  orientation?: "landscape" | "portrait" | "square"
  fileSize?: number
  durationSeconds?: number
  codec?: string
  container?: string
  available: boolean
  sourceFingerprint?: string
}

/** Metadata for private, administrator-uploaded music the business owns or is licensed to use. */
export type MarketingAudioTrack = {
  id: string
  title: string
  artistSource?: string | null
  filename: string
  mimeType: "audio/mpeg" | "audio/mp4" | "audio/wav"
  fileSize: number
  durationSeconds: number
  createdAt: string
  createdBy?: string | null
  /** Short-lived URL for an authenticated CRM preview only. */
  signedUrl?: string | null
}

export const REEL_LOGO_PLACEMENTS = [
  "none",
  "top_left",
  "top_right",
  "bottom_left",
  "bottom_right",
  "end_card_only",
] as const

export type ReelLogoPlacement = (typeof REEL_LOGO_PLACEMENTS)[number]
export type ReelLogoScale = "small" | "medium" | "large"
export type ReelTypographyStyle = "editorial_serif" | "refined_serif" | "modern_sans" | "minimal_sans"

export const STORY_LAYOUT_STYLES = [
  "full_bleed_gradient",
  "editorial_panel",
  "lower_third",
  "dark_panel",
  "light_panel",
] as const

export type StoryLayoutStyle =
  (typeof STORY_LAYOUT_STYLES)[number]

/** Concise visual copy that is rendered into a Story creative, never a feed caption. */
export type StoryCopy = {
  headline: string
  supportingLine: string
  highlights: string[]
  priceLine: string
  cta: string
}

export type StoryComposition = {
  propertyId: string
  format: "story"
  aspectRatio: "9:16"
  sourceAssetId: string
  storyCopy: StoryCopy
  layoutStyle: StoryLayoutStyle
  typographyStyle: ReelTypographyStyle
  /** Invalidates an older derived Story whenever visual inputs change. */
  renderToken: string
  logo: {
    enabled: boolean
    placement: "top_left" | "top_right" | "bottom_left" | "bottom_right"
    scale: "small" | "medium" | "large"
    opacity: number
    assetId?: string | null
  }
  marketingContract?: MarketingContentContract
}

/** A private, administrator-uploaded brand asset. It is never source property media. */
export type MarketingBrandAsset = {
  id: string
  kind: "logo"
  storagePath: string
  filename: string
  mimeType: "image/png" | "image/webp"
  width?: number | null
  height?: number | null
  active: boolean
  createdAt: string
  createdBy?: string | null
  signedUrl?: string | null
}

export type MarketingContent = {
  id: string
  campaignId?: string | null
  accountId?: string | null
  primaryPropertyId?: string | null
  propertySnapshot: Record<string, unknown>
  contentType: MarketingContentType
  /** Canonical V2 delivery format; derived explicitly for untouched legacy records. */
  format: MarketingFormat
  /** Canonical V2 editorial objective; derived explicitly for untouched legacy records. */
  objective: MarketingObjective
  creativeDirection: CreativeDirection | string
  title?: string | null
  status: MarketingStatus
  caption?: string | null
  shortCaption?: string | null
  headline?: string | null
  hook?: string | null
  cta?: string | null
  hashtags: string[]
  altText?: string | null
  creative: Record<string, unknown>
  composition: ReelComposition | StoryComposition | Record<string, unknown>
  proposedPublishAt?: string | null
  publishedAt?: string | null
  rejectionReason?: string | null
  lastError?: string | null
  activeReelVersionId?: string | null
  createdAt: string
  updatedAt: string
  propertyName?: string | null
  propertyLocation?: string | null
  coverUrl?: string | null
  renderedUrl?: string | null
}

export type PropertyFactSnapshot = {
  id: string
  title: string
  location?: string
  locality?: string
  price?: string
  bedrooms?: number
  bathrooms?: number
  carpetArea?: number
  builtUpArea?: number
  plotArea?: number
  description?: string
  amenities: string[]
  features: string[]
  propertyType?: string
  listingType?: string
  transactionType?: string
  furnishing?: string
  developmentStage?: string
  status?: string
  developer?: string
  marketingPriority?: "high" | "normal" | "low" | "paused"
  media: Array<{
    id: string
    url: string
    type: "image" | "video"
    isCover: boolean
    mimeType?: string
    width?: number
    height?: number
    fileSize?: number
    durationSeconds?: number
    codec?: string
    container?: string
    hash?: string
  }>
}

export type ReelScene = {
  assetId: string
  start: number
  duration: number
  crop: "cover"
  motion: "none" | "slow_zoom" | "pan_left" | "pan_right"
  overlay?: {
    text: string
    /** Legacy positions are kept so existing compositions remain renderable. */
    position: "top" | "center" | "bottom" | "top_left" | "top_right" | "lower_left" | "lower_right"
    type?: "hook" | "property_label" | "key_fact" | "price" | "cta" | "end_card"
  }
  transitionOut: "fade" | "cross_dissolve" | "slide" | "zoom" | "blur"
}

export type ReelComposition = {
  propertyId: string
  format: "reel" | "carousel" | "single_image" | "story" | "infographic"
  aspectRatio: "9:16" | "1:1" | "4:5"
  duration: number
  scenes: ReelScene[]
  caption: string
  hashtags: string[]
  cta: string
  coverText: string
  /** Fixed, Docker-installed typography selected from a controlled style set. */
  typographyStyle?: ReelTypographyStyle
  audio: {
    type: "none" | "uploaded" | "royalty_free" | "original" | "instagram_manual"
    id?: string | null
    label?: string | null
    durationSeconds?: number | null
  }
  logo?: {
    placement: ReelLogoPlacement
    scale: ReelLogoScale
    opacity: number
    margin?: number
    assetId?: string | null
  }
  marketingContract?: MarketingContentContract
}

export type ReelStoryboard = {
  hook: string
  typographyStyle?: ReelTypographyStyle
  scenes: Array<{
    assetId: string
    overlayText: string
    durationSeconds: number
    overlayPosition: "top_left" | "top_right" | "center" | "lower_left" | "lower_right"
    overlayType: "hook" | "property_label" | "key_fact" | "price" | "cta"
  }>
  endCard: { headline: string; cta: string }
}

export type MarketingReelVersion = {
  id: string
  contentId: string
  versionNumber: number
  status: "draft" | "approved" | "rendering" | "rendered" | "failed"
  isCurrent: boolean
  composition: ReelComposition
  sourceAssetIds: string[]
  logoSettings: ReelComposition["logo"] | null
  audioSettings: ReelComposition["audio"] | null
  renderedAssetId?: string | null
  userPrompt?: string | null
  lastError?: string | null
  createdAt: string
  createdBy?: string | null
  approvedAt?: string | null
  renderedAt?: string | null
}

export type InstagramAccount = {
  id: string
  /** The external account ID is intentionally masked before it reaches the UI. */
  maskedAccountId?: string | null
  username?: string | null
  displayName?: string | null
  accountType?: string | null
  profileImageUrl?: string | null
  status: "connected" | "expiring" | "expired" | "revoked" | "error" | "disconnected"
  tokenExpiresAt?: string | null
  connectedAt?: string | null
  lastVerifiedAt?: string | null
  scopes: string[]
}

export type MarketingPublication = {
  id: string
  contentId: string
  status: "pending" | "processing" | "published" | "failed"
  instagramMediaId?: string | null
  permalink?: string | null
  publishedAt?: string | null
  /** Whether media_publish may have completed despite a lost response. */
  publishAttemptedAt?: string | null
  lastError?: string | null
}

export type MarketingJobType =
  | "analyze_media"
  | "generate_creative"
  | "render_image"
  | "render_carousel"
  | "render_reel"
  | "publish_instagram"
  | "sync_publish_status"
  | "sync_analytics"

export type MarketingJob = {
  id: string
  contentId?: string | null
  type: MarketingJobType
  status: "queued" | "running" | "completed" | "failed" | "cancelled"
  progress: number
  input: Record<string, unknown>
  output: Record<string, unknown>
  error?: string | null
  attempts: number
  maxAttempts: number
  runAfter: string
  createdAt: string
  updatedAt: string
}

export type MarketingBrandSettings = {
  brandName?: string | null
  instagramHandle?: string | null
  website?: string | null
  whatsappCta?: string | null
  preferredTone: string
  preferredCta?: string | null
  defaultHashtags: string[]
  excludedWords: string[]
  fontFamily?: string | null
  brandColors: { primary?: string; accent?: string }
  timezone: string
  defaultReelLogoPlacement: ReelLogoPlacement
  defaultReelLogoOpacity: number
  defaultReelLogoScale: ReelLogoScale
}

export type CampaignStatus =
  | "draft"
  | "planning"
  | "plan_ready"
  | "generating"
  | "review_required"
  | "partially_approved"
  | "approved"
  | "partially_scheduled"
  | "scheduled"
  | "active"
  | "completed"
  | "cancelled"

export type CampaignPlanItem = {
  propertyId: string
  propertyName: string
  contentType: MarketingContentType
  creativeDirection: CreativeDirection
  plannedFor: string
  hook: string
}

export type MarketingCampaign = {
  id: string
  title: string
  objective?: string | null
  status: CampaignStatus
  durationDays?: number | null
  postingFrequency?: number | null
  plannedStartAt?: string | null
  plannedEndAt?: string | null
  plan: CampaignPlanItem[]
  createdAt: string
}

export const CONTENT_TYPE_LABELS: Record<MarketingContentType, string> = {
  reel: "Instagram Reel",
  single_image: "Single image post",
  carousel: "Carousel",
  story: "Story",
  infographic: "Infographic",
  property_spotlight: "Property spotlight",
  new_listing: "New listing",
  price_update: "Price update",
  just_listed: "Just listed",
  luxury_lifestyle: "Luxury lifestyle",
  investment_opportunity: "Investment opportunity",
  location_spotlight: "Location spotlight",
  feature_highlight: "Feature highlight",
  architecture_highlight: "Architecture highlight",
  construction_update: "Construction update",
  inventory_roundup: "Available inventory roundup",
  property_comparison: "Property comparison",
}
