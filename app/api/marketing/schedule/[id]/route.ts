import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { ScheduleSchema } from "@/lib/marketing/schemas"
import { SchedulerService } from "@/lib/marketing/services/scheduler-service"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = ScheduleSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid schedule." }, { status: 400 })

  try {
    const { id } = await context.params
    const content = await SchedulerService.schedule({
      contentId: id,
      scheduledFor: parsed.data.scheduledFor,
      timezone: parsed.data.timezone,
      adminId: access.user.id,
    })
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scheduling failed." }, { status: 409 })
  }
}
