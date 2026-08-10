import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { InstagramService } from "@/lib/marketing/services/instagram-service"
import { TokenCryptoService } from "@/lib/marketing/services/token-crypto-service"

export async function POST() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const account = await MarketingRepository.getInstagramAccountSecret()
  if (account?.access_token_ciphertext && account.access_token_ciphertext !== "disconnected") {
    try {
      await InstagramService.revokeAccess(TokenCryptoService.decrypt(String(account.access_token_ciphertext)))
    } catch (error) {
      // Local deactivation still proceeds: a revoked/expired remote token must not trap future schedules.
      console.warn("Instagram remote revoke could not be confirmed:", error instanceof Error ? error.message : "unknown error")
    }
  }
  await MarketingRepository.disconnectInstagramAccount()
  await MarketingRepository.addAuditLog({ actorId: access.user.id, action: "instagram.disconnected", metadata: { scheduledPostsBlocked: true } })
  return NextResponse.json({ ok: true })
}
