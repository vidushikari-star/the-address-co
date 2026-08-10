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

export type MarketingContent = {
  id: string
  campaignId?: string | null
  accountId?: string | null
  primaryPropertyId?: string | null
  propertySnapshot: Record<string, unknown>
  contentType: MarketingContentType
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
  composition: ReelComposition | Record<string, unknown>
  proposedPublishAt?: string | null
  publishedAt?: string | null
  rejectionReason?: string | null
  lastError?: string | null
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
  developmentStage?: string
  status?: string
  marketingPriority?: "high" | "normal" | "low" | "paused"
  media: Array<{
    id: string
    url: string
    type: "image" | "video"
    isCover: boolean
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
    position: "top" | "center" | "bottom"
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
  audio: {
    type: "none" | "uploaded" | "royalty_free" | "original" | "instagram_manual"
    id?: string | null
    label?: string | null
    durationSeconds?: number | null
  }
}

export type InstagramAccount = {
  id: string
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
