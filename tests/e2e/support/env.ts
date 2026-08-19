export type E2eRole = "admin" | "sales" | "unprofiled"

export type E2eCredentials = {
  email: string
  password: string
}

export type E2eEnvironment = {
  baseUrl: string
  supabaseUrl: string
  anonKey: string
  serviceRoleKey: string
  runId: string
  credentials: Record<E2eRole, E2eCredentials>
}

function required(key: string): string {
  const value = process.env[key]?.trim()
  if (!value) throw new Error(`E2E test configuration is missing ${key}`)
  return value
}

export function getE2eEnvironment(): E2eEnvironment {
  return {
    baseUrl: required("E2E_BASE_URL"),
    supabaseUrl: required("E2E_SUPABASE_URL"),
    anonKey: required("E2E_SUPABASE_ANON_KEY"),
    serviceRoleKey: required("E2E_SUPABASE_SERVICE_ROLE_KEY"),
    runId: required("E2E_RUN_ID"),
    credentials: {
      admin: {
        email: required("E2E_ADMIN_EMAIL"),
        password: required("E2E_ADMIN_PASSWORD"),
      },
      sales: {
        email: required("E2E_SALES_EMAIL"),
        password: required("E2E_SALES_PASSWORD"),
      },
      unprofiled: {
        email: required("E2E_UNPROFILED_EMAIL"),
        password: required("E2E_UNPROFILED_PASSWORD"),
      },
    },
  }
}
