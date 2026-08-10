import type { ReelComposition, ReelScene } from "@/lib/marketing/types"
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
              position: index === 0 ? "center" : isLast ? "bottom" : "bottom",
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
      audio: {
        type: "instagram_manual",
        label: input.creative.audioStyle === "manual_instagram"
          ? "Add music in Instagram after publishing"
          : `Suggested: ${input.creative.audioStyle.replaceAll("_", " ")}`,
      },
    })
  }
}
