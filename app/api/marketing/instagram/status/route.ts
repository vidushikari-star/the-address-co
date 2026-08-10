import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

export async function GET() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const account = await MarketingRepository.getInstagramAccount()
  return NextResponse.json({
    account,
    requiredScopes: ["instagram_business_basic", "instagram_business_content_publish"],
  })
}
