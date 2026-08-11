import { NextResponse } from "next/server"
import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

export async function GET() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  try {
    return NextResponse.json({ tracks: await MarketingRepository.listAudioTracks() })
  } catch {
    return NextResponse.json({ error: "Unable to load the Audio Library." }, { status: 500 })
  }
}

export async function POST() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  return NextResponse.json({ error: "Audio files upload directly to private storage. Request a signed upload permission first." }, { status: 410 })
}
