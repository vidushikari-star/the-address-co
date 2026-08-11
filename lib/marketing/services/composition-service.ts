import type { ReelComposition, ReelScene, ReelStoryboard, ReelTypographyStyle } from "@/lib/marketing/types"
import { ReelCompositionSchema } from "@/lib/marketing/schemas"

type Creative = {
  caption: string
  hashtags: string[]
  cta: string
  coverText: string
  onScreenText: string[]
  suggestedDuration: 15 | 20 | 30 | 45 | 60
  transitions: Array<ReelScene["transitionOut"]>
  audioStyle: string
}

export class CompositionService {
  static composeReel(input: {
    propertyId: string
    assetIds: string[]
    creative: Creative
    audio?: ReelComposition["audio"]
    logo?: ReelComposition["logo"]
    typographyStyle?: ReelTypographyStyle
  }): ReelComposition {
    const selected = input.assetIds.slice(0, 10)
    if (!selected.length) {
      throw new Error("A Reel needs at least one original property image or video.")
    }

    const duration = input.creative.suggestedDuration
    const perScene = Math.max(2, Math.floor(duration / selected.length))
    let cursor = 0

    const scenes = selected.map((assetId, index) => {
      const isLast = index === selected.length - 1
      const sceneDuration = isLast ? duration - cursor : perScene
      const scene: ReelScene = {
        assetId,
        start: cursor,
        duration: Math.max(2, sceneDuration),
        crop: "cover",
        motion: index % 3 === 0 ? "slow_zoom" : index % 3 === 1 ? "pan_left" : "pan_right",
        overlay: input.creative.onScreenText[index]
          ? {
              text: input.creative.onScreenText[index],
              position: index === 0 ? "top_left" : isLast ? "lower_left" : "lower_left",
              type: index === 0 ? "hook" : isLast ? "cta" : "key_fact",
            }
          : undefined,
        transitionOut: input.creative.transitions[index % input.creative.transitions.length] ?? "cross_dissolve",
      }
      cursor += scene.duration
      return scene
    })

    return ReelCompositionSchema.parse({
      propertyId: input.propertyId,
      format: "reel",
      aspectRatio: "9:16",
      duration: scenes.reduce((total, scene) => total + scene.duration, 0),
      scenes,
      caption: input.creative.caption,
      hashtags: input.creative.hashtags,
      cta: input.creative.cta,
      coverText: input.creative.coverText,
      typographyStyle: input.typographyStyle ?? "modern_sans",
      // The API does not attach Instagram's licensed music catalogue. Reels
      // are silent by default until an actual uploaded/audio asset workflow is added.
      audio: input.audio ?? { type: "none", label: "No audio selected" },
      logo: input.logo,
    })
  }

  /** Turns validated, concise AI storyboard output into the worker's render composition. */
  static composeStoryboard(input: {
    propertyId: string
    storyboard: ReelStoryboard
    creative: Pick<Creative, "caption" | "hashtags" | "cta" | "coverText" | "transitions">
    audio: ReelComposition["audio"]
    logo?: ReelComposition["logo"]
    typographyStyle?: ReelTypographyStyle
  }): ReelComposition {
    const sourceScenes = input.storyboard.scenes
    if (!sourceScenes.length) throw new Error("A Reel storyboard needs at least one source scene.")

    let cursor = 0
    const scenes: ReelScene[] = sourceScenes.map((scene, index) => {
      const duration = Number(scene.durationSeconds.toFixed(2))
      const output: ReelScene = {
        assetId: scene.assetId,
        start: cursor,
        duration,
        crop: "cover",
        motion: index % 3 === 0 ? "slow_zoom" : index % 3 === 1 ? "pan_left" : "pan_right",
        overlay: scene.overlayText ? {
          text: scene.overlayText,
          position: scene.overlayPosition,
          type: scene.overlayType,
        } : undefined,
        transitionOut: input.creative.transitions[index % input.creative.transitions.length] ?? "cross_dissolve",
      }
      cursor += duration
      return output
    })

    // A dedicated final scene makes the end card visually intentional while
    // keeping the original property media immutable and reference-only.
    const finalSource = sourceScenes[sourceScenes.length - 1]
    const endCardDuration = 3
    scenes.push({
      assetId: finalSource.assetId,
      start: cursor,
      duration: endCardDuration,
      crop: "cover",
      motion: "none",
      overlay: {
        text: `${input.storyboard.endCard.headline}\n${input.storyboard.endCard.cta}`,
        position: "center",
        type: "end_card",
      },
      transitionOut: "fade",
    })

    return ReelCompositionSchema.parse({
      propertyId: input.propertyId,
      format: "reel",
      aspectRatio: "9:16",
      duration: scenes.reduce((total, scene) => total + scene.duration, 0),
      scenes,
      caption: input.creative.caption,
      hashtags: input.creative.hashtags,
      cta: input.creative.cta,
      coverText: input.creative.coverText,
      typographyStyle: input.storyboard.typographyStyle ?? input.typographyStyle ?? "modern_sans",
      audio: input.audio,
      logo: input.logo,
    })
  }
}
