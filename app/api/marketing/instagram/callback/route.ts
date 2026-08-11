import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { InstagramService } from "@/lib/marketing/services/instagram-service"
import { TokenCryptoService } from "@/lib/marketing/services/token-crypto-service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const fallback = new URL("/marketing/settings?instagram=error", request.url)
  const error = url.searchParams.get("error")
  if (error) {
    fallback.searchParams.set("reason", error)
    return NextResponse.redirect(fallback)
  }

  try {
    const rawState = url.searchParams.get("state") ?? ""
    InstagramService.verifyAuthorizationState(rawState)
    const access = await requireMarketingApiAccess()
    if (!access.user) {
      return NextResponse.json({ error: access.user ? "Forbidden" : "Unauthorized" }, { status: access.user ? 403 : 401 })
    }
    const returnTo = await MarketingRepository.consumeOAuthState({
      stateHash: InstagramService.hashOAuthState(rawState),
      userId: access.user.id,
    })

    const code = url.searchParams.get("code")
    if (!code) throw new Error("Instagram did not return an authorization code.")
    const connection = await InstagramService.exchangeCode(code)
    await MarketingRepository.upsertInstagramAccount({
      externalAccountId: connection.instagramAccountId,
      username: connection.username,
      displayName: connection.displayName,
      accountType: connection.accountType,
      profileImageUrl: connection.profileImageUrl,
      accessTokenCiphertext: TokenCryptoService.encrypt(connection.accessToken),
      tokenExpiresAt: connection.expiresAt,
      scopes: connection.scopes,
      connectedBy: access.user.id,
    })
    await MarketingRepository.addAuditLog({
      actorId: access.user.id,
      action: "instagram.connected",
      metadata: { accountId: connection.instagramAccountId, username: connection.username ?? null },
    })

    return NextResponse.redirect(new URL(`${returnTo}?instagram=connected`, request.url))
  } catch {
    // OAuth providers can include request-specific data in failures. Keep
    // browser redirects and logs free of authorization codes and tokens.
    console.error("Instagram callback failed.")
    return NextResponse.redirect(fallback)
  }
}
