import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { InstagramService } from "@/lib/marketing/services/instagram-service"
import { TokenCryptoService } from "@/lib/marketing/services/token-crypto-service"

function friendlyMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Instagram could not be reached."
  if (/expired|token|oauth/i.test(message)) return "Instagram access has expired. Please reconnect your account."
  if (/permission|scope/i.test(message)) return "Instagram access is missing a required publishing permission. Please reconnect your account."
  return "Instagram could not be reached. Check the account connection and try again."
}

export async function POST() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const account = await MarketingRepository.getInstagramAccountSecret()
  if (!account || account.status === "disconnected") {
    return NextResponse.json({ healthy: false, message: "Connect an Instagram professional account first." }, { status: 409 })
  }
  if (account.token_expires_at && new Date(String(account.token_expires_at)) <= new Date()) {
    await MarketingRepository.updateInstagramConnectionHealth({ status: "expired" })
    return NextResponse.json({ healthy: false, message: "Instagram access has expired. Please reconnect your account." }, { status: 409 })
  }

  try {
    const profile = await InstagramService.verifyConnection(TokenCryptoService.decrypt(String(account.access_token_ciphertext)))
    await MarketingRepository.updateInstagramConnectionHealth({ status: "connected" })
    await MarketingRepository.addAuditLog({ actorId: access.user.id, action: "instagram.connection_verified", metadata: { accountId: profile.id } })
    return NextResponse.json({ healthy: true, message: "Connection healthy.", username: profile.username, accountType: profile.account_type })
  } catch (error) {
    await MarketingRepository.updateInstagramConnectionHealth({ status: "error" })
    return NextResponse.json({ healthy: false, message: friendlyMessage(error) }, { status: 409 })
  }
}
