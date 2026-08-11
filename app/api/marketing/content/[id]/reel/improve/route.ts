import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { ImproveReelSchema } from "@/lib/marketing/schemas"
import { ReelVersionService } from "@/lib/marketing/services/reel-version-service"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = ImproveReelSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Enter a focused creative instruction of up to 600 characters." }, { status: 400 })
  try {
    const { id } = await context.params
    const version = await ReelVersionService.improve({ contentId: id, prompt: parsed.data.prompt, adminId: access.user.id })
    return NextResponse.json({ version }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create the revised Reel version." }, { status: 400 })
  }
}
