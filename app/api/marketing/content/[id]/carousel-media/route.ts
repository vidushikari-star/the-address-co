import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { CarouselMediaUpdateSchema } from "@/lib/marketing/schemas"

type Context = { params: Promise<{ id: string }> }

/** Changes only Marketing's ordered source references; CRM gallery media is read-only. */
export async function PATCH(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const parsed = CarouselMediaUpdateSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose 2–10 unique property images for this Carousel." }, { status: 400 })

  const { id } = await context.params
  try {
    const content = await MarketingRepository.updateCarouselMedia({
      contentId: id,
      propertyImageIds: parsed.data.propertyImageIds,
      updatedBy: access.user.id,
    })
    revalidatePath("/marketing/content")
    revalidatePath("/marketing/calendar")
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Carousel media could not be updated." }, { status: 409 })
  }
}
