import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { InstagramService } from "@/lib/marketing/services/instagram-service"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

export async function GET(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  try {
    const requestedReturnTo = new URL(request.url).searchParams.get("returnTo")
    const returnTo = requestedReturnTo?.startsWith("/marketing") ? requestedReturnTo : "/marketing/settings"
    const state = InstagramService.createOAuthState()
    await MarketingRepository.createOAuthState({
      stateHash: InstagramService.hashOAuthState(state),
      userId: access.user.id,
      returnTo,
      expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
    })
    return NextResponse.redirect(InstagramService.createAuthorizationUrl(state))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start Instagram connection." }, { status: 503 })
  }
}
