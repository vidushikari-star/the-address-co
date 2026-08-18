type DashboardLoaderError = {
  code?: unknown
  status?: unknown
}

function getDashboardErrorCode(
  error: unknown
): string {
  if (
    typeof error === "object"
    && error !== null
    && "code" in error
    && typeof error.code === "string"
  ) {
    return error.code
  }

  return "unknown"
}

function isAuthorizationError(
  error: unknown
): boolean {
  const details = error as DashboardLoaderError | null

  return (
    getDashboardErrorCode(error) === "42501"
    || details?.status === 401
    || details?.status === 403
  )
}

function logDashboardLoaderError(
  area: string,
  userId: string,
  error: unknown
) {
  console.error(
    "Dashboard widget loader failed",
    {
      area,
      code: getDashboardErrorCode(error),
      message: "Dashboard widget request failed.",
      userId,
    }
  )
}

export async function loadRequiredDashboardData<T>(
  area: string,
  userId: string,
  load: () => Promise<T>
): Promise<T> {
  try {
    return await load()
  } catch (error) {
    logDashboardLoaderError(
      area,
      userId,
      error
    )

    throw error
  }
}

export async function loadOptionalDashboardWidget<T>(
  area: string,
  userId: string,
  load: () => Promise<T>,
  fallback: () => T
): Promise<T> {
  try {
    return await load()
  } catch (error) {
    logDashboardLoaderError(
      area,
      userId,
      error
    )

    if (isAuthorizationError(error)) {
      throw error
    }

    return fallback()
  }
}
