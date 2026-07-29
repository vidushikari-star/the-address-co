import crypto from "crypto"

import { HousingLead, HousingLeadResponse } from "./types"

const BASE_URL = "https://pahal.housing.com/api/v0/get-broker-leads"

function getCredentials() {
  const profileId = process.env.HOUSING_PROFILE_ID
  const encryptionKey = process.env.HOUSING_ENCRYPTION_KEY

  if (!profileId) {
    throw new Error("HOUSING_PROFILE_ID is missing.")
  }

  if (!encryptionKey) {
    throw new Error("HOUSING_ENCRYPTION_KEY is missing.")
  }

  return {
    profileId,
    encryptionKey,
  }
}

function generateHash(currentTime: number, encryptionKey: string) {
  return crypto
    .createHmac("sha256", encryptionKey)
    .update(currentTime.toString())
    .digest("hex")
}

export interface FetchHousingLeadsOptions {
  startDate?: number
  endDate?: number
  perPage?: number
}

export async function fetchHousingLeads(
  options: FetchHousingLeadsOptions = {}
): Promise<HousingLead[]> {
  const { profileId, encryptionKey } = getCredentials()

  const currentTime = Math.floor(Date.now() / 1000)

  const endDate = options.endDate ?? currentTime

  // Housing only allows a maximum 2-day window
  const startDate =
    options.startDate ?? endDate - 2 * 24 * 60 * 60

  const perPage = options.perPage ?? 100

  const hash = generateHash(currentTime, encryptionKey)

  const url = new URL(BASE_URL)

  url.searchParams.set("id", profileId)
  url.searchParams.set("current_time", currentTime.toString())
  url.searchParams.set("start_date", startDate.toString())
  url.searchParams.set("end_date", endDate.toString())
  url.searchParams.set("hash", hash)
  url.searchParams.set("per_page", perPage.toString())

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()

    throw new Error(
      `Housing API Error (${response.status}): ${text}`
    )
  }

  const result: HousingLeadResponse = await response.json()

  return result.data ?? []
}