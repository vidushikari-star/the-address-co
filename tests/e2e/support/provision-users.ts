import { createClient, type User } from "@supabase/supabase-js"

import { getE2eEnvironment, type E2eCredentials, type E2eRole } from "./env"

type ProvisionedUser = {
  id: string
  email: string
}

function adminClient() {
  const environment = getE2eEnvironment()
  return createClient(environment.supabaseUrl, environment.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findAuthUser(email: string): Promise<User | null> {
  const client = adminClient()
  let page = 1

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error("Unable to list dedicated E2E auth users")

    const matched = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (matched) return matched
    if (data.users.length < 1000) return null
    page += 1
  }
}

async function ensureAuthUser(credentials: E2eCredentials): Promise<ProvisionedUser> {
  const client = adminClient()
  const existing = await findAuthUser(credentials.email)

  if (existing) {
    const { data, error } = await client.auth.admin.updateUserById(existing.id, {
      password: credentials.password,
      email_confirm: true,
    })
    if (error || !data.user?.email) throw new Error("Unable to update a dedicated E2E auth user")
    return { id: data.user.id, email: data.user.email }
  }

  const { data, error } = await client.auth.admin.createUser({
    email: credentials.email,
    password: credentials.password,
    email_confirm: true,
  })
  if (error || !data.user?.email) throw new Error("Unable to create a dedicated E2E auth user")
  return { id: data.user.id, email: data.user.email }
}

async function upsertCrmProfiles(user: ProvisionedUser, role: "admin" | "sales") {
  const client = adminClient()
  const fullName = `E2E ${role}`

  const { error: legacyProfileError } = await client
    .from("profiles")
    .upsert({ id: user.id, full_name: fullName, email: user.email }, { onConflict: "id" })
  if (legacyProfileError) throw new Error("Unable to provision the dedicated E2E legacy profile")

  const { error: profileError } = await client.from("user_profiles").upsert(
    { id: user.id, name: fullName, email: user.email, role },
    { onConflict: "id" }
  )
  if (profileError) throw new Error("Unable to provision the dedicated E2E CRM profile")
}

async function removeCrmProfiles(user: ProvisionedUser) {
  const client = adminClient()
  const { error: userProfileError } = await client.from("user_profiles").delete().eq("id", user.id)
  if (userProfileError) throw new Error("Unable to remove the E2E unprofiled CRM profile")

  const { error: legacyProfileError } = await client.from("profiles").delete().eq("id", user.id)
  if (legacyProfileError) throw new Error("Unable to remove the E2E unprofiled legacy profile")
}

/**
 * Creates or refreshes three dedicated disposable-project accounts. The
 * unprofiled user is deliberately left without either CRM profile row to test
 * the Stage 1 is_crm_user() authorization boundary.
 */
export async function provisionE2eUsers() {
  const { credentials } = getE2eEnvironment()
  const configuredRoles: Array<Exclude<E2eRole, "unprofiled">> = ["admin", "sales"]

  for (const role of configuredRoles) {
    const user = await ensureAuthUser(credentials[role])
    await upsertCrmProfiles(user, role)
  }

  const unprofiledUser = await ensureAuthUser(credentials.unprofiled)
  await removeCrmProfiles(unprofiledUser)
}
