type HousingInventoryAuditAdmin = {
  from: (table: string) => unknown
}

type AuditQuery = PromiseLike<{ error: { code?: string; message?: string } | null }>

export async function recordHousingInventoryRequest(
  admin: HousingInventoryAuditAdmin,
  input: {
    endpoint: string
    requestId: string
    authenticated: boolean
    status: number
    propertyCount: number
  }
) {
  try {
    const query = admin.from("integration_request_logs") as {
      insert: (value: Record<string, unknown>) => AuditQuery
    }
    const { error } = await query.insert({
      provider: "housing",
      endpoint: input.endpoint,
      request_id: input.requestId,
      authenticated: input.authenticated,
      response_status: input.status,
      property_count: input.propertyCount,
    })
    if (error) throw error
  } catch (error) {
    const details = error as { code?: unknown; message?: unknown }
    console.error("Housing inventory audit logging failed", {
      code: typeof details?.code === "string" ? details.code : "unknown",
      message: typeof details?.message === "string" ? details.message.slice(0, 160) : "Unknown error",
    })
  }
}
