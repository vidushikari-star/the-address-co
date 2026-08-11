"use server"

import { revalidatePath } from "next/cache"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import {
  PropertyCreateSchema,
  toPropertyCreatePayload,
  type PropertyCreateInput,
} from "@/lib/properties/property-schema"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type CreatePropertySuccess = {
  ok: true
  property: {
    id: string
    slug: string
  }
}

type CreatePropertyFailure = {
  ok: false
  error: string
}

export type CreatePropertyActionResult =
  | CreatePropertySuccess
  | CreatePropertyFailure

type CreatePropertyRpcRow = {
  property_id: string
  property_slug: string
}

function logCreateFailure(requestId: string | undefined, error: unknown) {
  const details = error as { code?: unknown; message?: unknown; details?: unknown }

  console.error("Property creation failed", {
    requestId,
    code: typeof details?.code === "string" ? details.code : "unknown",
    message: typeof details?.message === "string" ? details.message.slice(0, 240) : "Unknown database error",
    details: typeof details?.details === "string" ? details.details.slice(0, 240) : undefined,
  })
}

export async function createPropertyAction(
  input: PropertyCreateInput
): Promise<CreatePropertyActionResult> {
  const parsed = PropertyCreateSchema.safeParse(input)

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the property details and try again.",
    }
  }

  const user = await getServerUserProfile()

  if (!user) {
    return {
      ok: false,
      error: "You do not have permission to create properties.",
    }
  }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc("create_property_for_user", {
      property_payload: toPropertyCreatePayload(parsed.data),
      p_request_id: parsed.data.requestId,
    })

    if (error) {
      logCreateFailure(parsed.data.requestId, error)
      return {
        ok: false,
        error: `We could not save this property. Please try again. Reference: ${parsed.data.requestId}`,
      }
    }

    const row = (data as CreatePropertyRpcRow[] | null)?.[0]

    if (!row?.property_id || !row.property_slug) {
      console.error("Property creation returned no property", {
        requestId: parsed.data.requestId,
      })
      return {
        ok: false,
        error: `We could not confirm the saved property. Please try again. Reference: ${parsed.data.requestId}`,
      }
    }

    revalidatePath("/properties")
    revalidatePath(`/properties/${row.property_slug}`)

    return {
      ok: true,
      property: {
        id: row.property_id,
        slug: row.property_slug,
      },
    }
  } catch (error) {
    logCreateFailure(parsed.data.requestId, error)
    return {
      ok: false,
      error: `We could not save this property. Please try again. Reference: ${parsed.data.requestId}`,
    }
  }
}
