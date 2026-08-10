import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { ApprovalService } from "@/lib/marketing/services/approval-service"
import { ApprovalActionSchema } from "@/lib/marketing/schemas"

type Context = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const parsed = ApprovalActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Invalid approval action." }, { status: 400 })

  try {
    const { id } = await context.params
    const content = parsed.data.action === "approve"
      ? await ApprovalService.approve(id, access.user.id, parsed.data.note)
      : parsed.data.action === "request_changes"
        ? await ApprovalService.requestChanges(id, access.user.id, parsed.data.note)
        : await ApprovalService.reject(id, access.user.id, parsed.data.note)
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Approval action failed." }, { status: 409 })
  }
}
