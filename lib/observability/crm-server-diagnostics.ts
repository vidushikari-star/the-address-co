type CrmServerDataFailure = {
  route: string
  area: string
  userId?: string | null
  error: unknown
}

function getDatabaseErrorCode(error: unknown): string {
  if (typeof error === "object" && error && "code" in error && typeof error.code === "string") {
    return error.code
  }

  return "unknown"
}

/**
 * Records enough context to diagnose an authenticated server-data failure
 * without emitting CRM records, credentials, query text, or access tokens.
 */
export function logCrmServerDataFailure({ route, area, userId, error }: CrmServerDataFailure) {
  console.error("Authenticated CRM server data load failed", {
    route,
    area,
    userId: userId ?? "unavailable",
    code: getDatabaseErrorCode(error),
    message: "CRM data query failed.",
  })
}

export async function loadAuthenticatedCrmData<T>(
  context: Omit<CrmServerDataFailure, "error">,
  load: () => Promise<T>,
): Promise<T> {
  try {
    return await load()
  } catch (error) {
    logCrmServerDataFailure({ ...context, error })
    throw error
  }
}
