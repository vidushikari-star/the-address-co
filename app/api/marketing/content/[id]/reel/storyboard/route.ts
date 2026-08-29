import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { ReelStoryboardUpdateSchema } from "@/lib/marketing/schemas"
import { ReelVersionService } from "@/lib/marketing/services/reel-version-service"

type Context = { params: Promise<{ id: string }> }

/** Saves an editable Reel draft version; historic rendered versions stay immutable. */
export async function PATCH(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = ReelStoryboardUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose 1–10 unique Reel scenes with safe overlay copy." }, { status: 400 })

  try {
    const { id } = await context.params
    const result = await ReelVersionService.updateStoryboard({ contentId: id, scenes: parsed.data.scenes, adminId: access.user.id })
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The Reel storyboard could not be saved." }, { status: 409 })
  }
}
