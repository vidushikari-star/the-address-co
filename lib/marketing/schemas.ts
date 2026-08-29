import { z } from "zod"

import {
  CREATIVE_DIRECTIONS,
  MARKETING_FORMATS,
  MARKETING_OBJECTIVES,
  MARKETING_STATUSES,
  STORY_LAYOUT_STYLES,
} from "@/lib/marketing/types"
import { REEL_TYPOGRAPHY_STYLES } from "@/lib/marketing/reel-typography"
import { MARKETING_SAFE_FACT_KEYS } from "@/lib/marketing/fact-contract"

const MarketingContractSchema = z.object({
  version: z.literal("v2"),
  format: z.enum(MARKETING_FORMATS),
  objective: z.enum(MARKETING_OBJECTIVES),
  creativeDirection: z.literal("luxury_editorial"),
  mediaSelection: z.object({
    mode: z.enum(["automatic", "curated"]),
    assetIds: z.array(z.string().uuid()).max(12),
  }),
  brandTreatment: z.object({
    version: z.literal("v1"),
    logo: z.object({
      enabled: z.boolean(),
      assetId: z.string().uuid().nullable(),
      placement: z.enum(["none", "top_left", "top_right", "bottom_left", "bottom_right", "end_card_only"]),
      scale: z.enum(["small", "medium", "large"]),
      opacity: z.number().min(0.1).max(1),
    }),
  }),
})

export const CreateContentSchema = z.object({
  propertyId: z.string().uuid(),
  format: z.enum(MARKETING_FORMATS),
  objective: z.enum(MARKETING_OBJECTIVES),
  creativeDirection: z.enum(CREATIVE_DIRECTIONS).default("luxury_editorial"),
  /** Property-image IDs are resolved to immutable Marketing asset IDs server-side. */
  propertyMediaIds: z.array(z.string().uuid()).min(1).max(12).optional(),
  brandTreatment: z.object({
    enabled: z.boolean().default(false),
    placement: z.enum(["auto", "top_left", "top_right", "bottom_left", "bottom_right", "end_card_only"]).default("auto"),
    scale: z.enum(["small", "medium", "large"]).default("small"),
    opacity: z.number().min(0.1).max(1).default(0.8),
  }).default({ enabled: false, placement: "auto", scale: "small", opacity: 0.8 }),
  idempotencyKey: z.string().uuid(),
}).strict()

export const ContentUpdateSchema = z.object({
  caption: z.string().max(2_200).optional(),
  shortCaption: z.string().max(500).optional(),
  headline: z.string().max(160).optional(),
  hook: z.string().max(160).optional(),
  cta: z.string().max(240).optional(),
  hashtags: z.array(z.string().min(2).max(80)).max(30).optional(),
  altText: z.string().max(500).optional(),
  composition: z.record(z.string(), z.unknown()).optional(),
})

export const CarouselMediaUpdateSchema = z.object({
  propertyImageIds: z.array(z.string().uuid()).min(2).max(10),
}).superRefine((value, context) => {
  if (new Set(value.propertyImageIds).size !== value.propertyImageIds.length) {
    context.addIssue({ code: "custom", path: ["propertyImageIds"], message: "Carousel media cannot contain duplicate images." })
  }
})

export const GenerateContentCopySchema = z.object({
  fields: z.array(z.enum(["headline", "hook", "caption", "cta", "hashtags", "story_copy"])).min(1).max(6).optional(),
})

export const BulkDeleteDraftsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
})

export const ScheduledContentActionSchema = z.object({
  action: z.enum(["unschedule", "delete"]),
  ids: z.array(z.string().uuid()).min(1).max(100),
})

export const ApprovalActionSchema = z.object({
  action: z.enum(["approve", "request_changes", "reject"]),
  note: z.string().max(1_000).optional(),
})

export const ScheduleSchema = z.object({
  scheduledFor: z.string().datetime(),
  timezone: z.string().min(1).max(100),
})

export const CreateCampaignSchema = z.object({
  propertyIds: z.array(z.string().uuid()).min(1).max(50),
  title: z.string().trim().min(3).max(140),
  objective: z.string().trim().max(140).optional(),
  durationDays: z.number().int().min(1).max(90),
  postingFrequency: z.number().int().min(1).max(7).default(3),
  creativeDirection: z.enum(CREATIVE_DIRECTIONS).default("surprise_me"),
  startsAt: z.string().datetime(),
})

export const ReelSceneSchema = z.object({
  assetId: z.string().uuid(),
  start: z.number().min(0).max(60),
  duration: z.number().positive().max(60),
  crop: z.literal("cover"),
  motion: z.enum(["none", "slow_zoom", "pan_left", "pan_right"]),
  overlay: z.object({
    text: z.string().max(120),
    position: z.enum(["top", "center", "bottom", "top_left", "top_right", "lower_left", "lower_right"]),
    type: z.enum(["hook", "property_label", "key_fact", "price", "cta", "end_card"]).optional(),
  }).optional(),
  transitionOut: z.enum(["fade", "cross_dissolve", "slide", "zoom", "blur"]),
})

export const ReelStoryboardUpdateSchema = z.object({
  scenes: z.array(ReelSceneSchema).min(1).max(10),
}).superRefine((value, context) => {
  const ids = value.scenes.map(scene => scene.assetId)
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: "custom", path: ["scenes"], message: "A Reel scene can use each selected property asset only once." })
  }
})

export const ReelCompositionSchema = z.object({
  propertyId: z.string().uuid(),
  format: z.enum(["reel", "carousel", "single_image", "story", "infographic"]),
  aspectRatio: z.enum(["9:16", "1:1", "4:5"]),
  duration: z.number().positive().max(60),
  scenes: z.array(ReelSceneSchema).max(12),
  caption: z.string().max(2_200),
  hashtags: z.array(z.string().max(80)).max(30),
  cta: z.string().max(240),
  coverText: z.string().max(120),
  typographyStyle: z.enum(REEL_TYPOGRAPHY_STYLES).default("modern_sans"),
  audio: z.object({
    type: z.enum(["none", "uploaded", "royalty_free", "original", "instagram_manual"]),
    id: z.string().uuid().nullable().optional(),
    label: z.string().max(120).nullable().optional(),
    durationSeconds: z.number().positive().max(3_600).nullable().optional(),
  }).superRefine((audio, context) => {
    if (audio.type === "uploaded" && !audio.id) {
      context.addIssue({ code: "custom", message: "Uploaded audio must reference an Audio Library track.", path: ["id"] })
    }
  }),
  logo: z.object({
    placement: z.enum(["none", "top_left", "top_right", "bottom_left", "bottom_right", "end_card_only"]),
    scale: z.enum(["small", "medium", "large"]),
    opacity: z.number().min(0.1).max(1),
    margin: z.number().int().min(0).max(160).optional(),
    assetId: z.string().uuid().nullable().optional(),
  }).optional(),
  marketingContract: MarketingContractSchema.optional(),
})

const ReelStoryboardSceneSchema = z.object({
  assetId: z.string().uuid(),
  overlayText: z.string().trim().max(120),
  durationSeconds: z.number().min(1.5).max(12),
  overlayPosition: z.enum(["top_left", "top_right", "center", "lower_left", "lower_right"]),
  overlayType: z.enum(["hook", "property_label", "key_fact", "price", "cta"]),
}).superRefine((scene, context) => {
  const hardLimit = scene.overlayType === "hook" ? 80 : scene.overlayType === "cta" ? 100 : 120
  if (scene.overlayText.length > hardLimit) {
    context.addIssue({
      code: "too_big",
      maximum: hardLimit,
      inclusive: true,
      origin: "string",
      path: ["overlayText"],
      message: "Overlay text is too long for the mobile Reel layout.",
    })
  }
})

const ReelStoryboardEndCardSchema = z.object({
  // The renderer combines these into one 120-character overlay. Keeping the
  // combined cap lower leaves room for line spacing in the social safe zone.
  headline: z.string().trim().min(1).max(70),
  cta: z.string().trim().min(1).max(48),
}).superRefine((endCard, context) => {
  if (`${endCard.headline}\n${endCard.cta}`.length > 100) {
    context.addIssue({
      code: "too_big",
      maximum: 100,
      inclusive: true,
      origin: "string",
      path: ["headline"],
      message: "Combined end-card text is too long for the mobile Reel layout.",
    })
  }
})

export const ReelStoryboardSchema = z.object({
  hook: z.string().trim().min(1).max(100),
  typographyStyle: z.enum(REEL_TYPOGRAPHY_STYLES).default("modern_sans"),
  scenes: z.array(ReelStoryboardSceneSchema).min(1).max(10),
  endCard: ReelStoryboardEndCardSchema,
})

export const ImproveReelSchema = z.object({
  prompt: z.string().trim().min(3).max(600),
})

/** Mobile-readable, visual Story copy. It is deliberately separate from feed captions. */
export const StoryCopySchema = z.object({
  headline: z.string().trim().min(1).max(72),
  supportingLine: z.string().trim().max(150),
  highlights: z.array(z.string().trim().min(1).max(60)).max(3),
  priceLine: z.string().trim().max(64),
  cta: z.string().trim().min(1).max(60),
})

export const StoryCompositionSchema = z.object({
  propertyId: z.string().uuid(),
  format: z.literal("story"),
  aspectRatio: z.literal("9:16"),
  sourceAssetId: z.string().uuid(),
  storyCopy: StoryCopySchema,
  layoutStyle: z.enum(STORY_LAYOUT_STYLES),
  typographyStyle: z.enum(REEL_TYPOGRAPHY_STYLES).default("modern_sans"),
  renderToken: z.string().uuid(),
  logo: z.object({
    enabled: z.boolean(),
    placement: z.enum(["top_left", "top_right", "bottom_left", "bottom_right"]),
    scale: z.enum(["small", "medium", "large"]),
    opacity: z.number().min(0.1).max(1),
    assetId: z.string().uuid().nullable().optional(),
  }),
  marketingContract: MarketingContractSchema.optional(),
})

export const StoryUpdateSchema = z.object({
  sourceAssetId: z.string().uuid(),
  storyCopy: StoryCopySchema,
  layoutStyle: z.enum(STORY_LAYOUT_STYLES),
  logoEnabled: z.boolean(),
})

export const ImproveStorySchema = z.object({
  prompt: z.string().trim().min(3).max(600),
})

export const CreativeOutputSchema = z.object({
  campaignConcept: z.string().trim().min(1).max(350),
  hook: z.string().trim().min(1).max(160),
  headline: z.string().trim().min(1).max(160),
  caption: z.string().trim().min(1).max(2_200),
  shortCaption: z.string().trim().min(1).max(500),
  cta: z.string().trim().min(1).max(240),
  hashtags: z.array(z.string().trim().min(2).max(80)).min(1).max(30),
  onScreenText: z.array(z.string().max(120)).max(12),
  carouselSlides: z.array(z.string().max(300)).min(1).max(10),
  storyCopy: StoryCopySchema,
  coverText: z.string().max(120),
  altText: z.string().max(500),
  suggestedDuration: z.union([z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60)]),
  transitions: z.array(z.enum(["fade", "cross_dissolve", "slide", "zoom", "blur"])).max(8),
  audioStyle: z.enum(["cinematic", "luxury_lounge", "tropical", "upbeat", "ambient", "architectural", "emotional", "trending_style", "manual_instagram"]),
  factsUsed: z.array(z.enum(MARKETING_SAFE_FACT_KEYS)).max(20),
  /** Stored beside creative JSON; legacy output can be reviewed without a migration. */
  claimProvenance: z.array(z.object({
    text: z.string().trim().min(1).max(240),
    factKey: z.enum(MARKETING_SAFE_FACT_KEYS),
    factValue: z.string().trim().min(1).max(240),
  })).max(30).default([]),
})

export const MarketingStatusSchema = z.enum(MARKETING_STATUSES)
