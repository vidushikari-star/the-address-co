import { z } from "zod"

import {
  CREATIVE_DIRECTIONS,
  MARKETING_CONTENT_TYPES,
  MARKETING_STATUSES,
} from "@/lib/marketing/types"

export const CreateContentSchema = z.object({
  propertyId: z.string().uuid(),
  contentType: z.enum(MARKETING_CONTENT_TYPES),
  creativeDirection: z.enum(CREATIVE_DIRECTIONS).default("surprise_me"),
  idempotencyKey: z.string().uuid(),
})

export const ContentUpdateSchema = z.object({
  caption: z.string().max(2_200).optional(),
  shortCaption: z.string().max(500).optional(),
  headline: z.string().max(160).optional(),
  hook: z.string().max(160).optional(),
  cta: z.string().max(240).optional(),
  hashtags: z.array(z.string().min(2).max(80)).max(30).optional(),
  composition: z.record(z.string(), z.unknown()).optional(),
})

export const GenerateContentCopySchema = z.object({
  fields: z.array(z.enum(["headline", "hook", "caption", "cta", "hashtags"])).min(1).max(5).optional(),
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
    position: z.enum(["top", "center", "bottom"]),
  }).optional(),
  transitionOut: z.enum(["fade", "cross_dissolve", "slide", "zoom", "blur"]),
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
  audio: z.object({
    type: z.enum(["none", "royalty_free", "original", "instagram_manual"]),
    id: z.string().nullable().optional(),
    label: z.string().max(120).nullable().optional(),
  }),
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
  storyCopy: z.array(z.string().max(200)).max(8),
  coverText: z.string().max(120),
  altText: z.string().max(500),
  suggestedDuration: z.union([z.literal(15), z.literal(20), z.literal(30), z.literal(45), z.literal(60)]),
  transitions: z.array(z.enum(["fade", "cross_dissolve", "slide", "zoom", "blur"])).max(8),
  audioStyle: z.enum(["cinematic", "luxury_lounge", "tropical", "upbeat", "ambient", "architectural", "emotional", "trending_style", "manual_instagram"]),
  factsUsed: z.array(z.enum([
    "title", "location", "price", "bedrooms", "bathrooms", "carpet_area",
    "built_up_area", "plot_area", "description", "amenities", "features",
    "property_type", "development_stage",
  ])).max(14),
})

export const MarketingStatusSchema = z.enum(MARKETING_STATUSES)
