import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

import type { MarketingContent, MarketingAsset } from "@/lib/marketing/types"

const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const

export type InstagramToken = {
  accessToken: string
  instagramAccountId: string
  username?: string
  displayName?: string
  accountType?: string
  profileImageUrl?: string
  expiresAt?: string
  scopes: string[]
}

type GraphResponse = Record<string, unknown>

export class InstagramApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code?: number,
  ) {
    super(message)
    this.name = "InstagramApiError"
  }

  get isAuthenticationFailure() {
    return this.statusCode === 401 || this.code === 190
  }

  get isRecoverable() {
    return this.statusCode === 408 || this.statusCode === 429 || this.statusCode >= 500
  }
}

export class InstagramContainerPendingError extends Error {
  constructor(readonly statusCode: string) {
    super(`Instagram media container is still processing (${statusCode}).`)
    this.name = "InstagramContainerPendingError"
  }
}

export class InstagramContainerTerminalError extends Error {
  constructor(readonly statusCode: string) {
    super(`Instagram media container ${statusCode.toLowerCase()}. Create a new publication attempt after reviewing the media.`)
    this.name = "InstagramContainerTerminalError"
  }
}

function oauthStateSecret() {
  const secret = process.env.MARKETING_OAUTH_STATE_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("MARKETING_OAUTH_STATE_SECRET must be at least 32 characters.")
  }
  return secret
}

function sign(value: string) {
  return createHmac("sha256", oauthStateSecret()).update(value).digest("base64url")
}

function apiBase() {
  return process.env.META_GRAPH_BASE_URL ?? "https://graph.instagram.com"
}

function apiVersion() {
  return process.env.META_GRAPH_API_VERSION ?? "v25.0"
}

async function requestGraph(input: {
  path: string
  accessToken: string
  method?: "GET" | "POST" | "DELETE"
  body?: URLSearchParams
}) {
  const url = new URL(`${apiBase()}/${apiVersion()}${input.path}`)
  const response = await fetch(url, {
    method: input.method ?? "GET",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      ...(input.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: input.body?.toString(),
    signal: AbortSignal.timeout(30_000),
  })
  const data = await response.json().catch(() => ({})) as GraphResponse
  if (!response.ok || data.error) {
    const error = typeof data.error === "object" && data.error
      ? data.error as Record<string, unknown>
      : {}
    const code = typeof error.code === "number" ? error.code : undefined
    const rawMessage = String(error.message ?? "")
    // Meta may echo input values in an error. Do not persist or log those
    // values; classify only the safe, actionable classes we need.
    const message = /oauth|access token|token.*expired|invalid.*token/i.test(rawMessage)
      ? "Instagram authentication failed. Reconnect the account."
      : /permission|scope|capability/i.test(rawMessage)
        ? "Instagram publishing permission was denied. Reconnect the account with publishing access."
        : `Instagram API request failed (HTTP ${response.status}${code ? `, code ${code}` : ""}).`
    throw new InstagramApiError(message, response.status, code)
  }
  return data
}

function mediaUrl(asset: MarketingAsset) {
  const url = asset.signedUrl ?? asset.sourceUrl
  if (!url || !/^https:\/\//i.test(url)) {
    throw new Error("A Meta-fetchable approved-media URL is required for Instagram publishing.")
  }
  return url
}

export class InstagramService {
  static requiredScopes() {
    return [...INSTAGRAM_SCOPES]
  }

  static createOAuthState() {
    const nonce = randomBytes(32).toString("base64url")
    return `${nonce}.${sign(nonce)}`
  }

  static hashOAuthState(state: string) {
    return createHash("sha256").update(state).digest("base64url")
  }

  static createAuthorizationUrl(state: string) {
    const redirectUri = process.env.META_REDIRECT_URI
    const appId = process.env.META_APP_ID
    if (!redirectUri || !appId) throw new Error("META_APP_ID and META_REDIRECT_URI are required to connect Instagram.")

    const url = new URL(process.env.META_INSTAGRAM_OAUTH_AUTHORIZE_URL ?? "https://www.instagram.com/oauth/authorize")
    url.searchParams.set("client_id", appId)
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("scope", INSTAGRAM_SCOPES.join(","))
    url.searchParams.set("state", state)
    return url.toString()
  }

  static verifyAuthorizationState(state: string) {
    const [payload, signature] = state.split(".")
    if (!payload || !signature) throw new Error("Missing Instagram OAuth state.")
    const expected = Buffer.from(sign(payload))
    const received = Buffer.from(signature)
    if (expected.byteLength !== received.byteLength || !timingSafeEqual(expected, received)) {
      throw new Error("Invalid Instagram OAuth state.")
    }

    return payload
  }

  static async exchangeCode(code: string): Promise<InstagramToken> {
    const clientId = process.env.META_APP_ID
    const clientSecret = process.env.META_APP_SECRET
    const redirectUri = process.env.META_REDIRECT_URI
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Meta OAuth environment variables are incomplete.")
    }

    const exchange = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
      signal: AbortSignal.timeout(30_000),
    })
    const shortLived = await exchange.json().catch(() => ({})) as {
      access_token?: string
      user_id?: string
      error_message?: string
    }
    if (!exchange.ok || !shortLived.access_token || !shortLived.user_id) {
      throw new Error(shortLived.error_message ?? "Instagram authorization-code exchange failed.")
    }

    const longLivedUrl = new URL(`${apiBase()}/access_token`)
    longLivedUrl.searchParams.set("grant_type", "ig_exchange_token")
    longLivedUrl.searchParams.set("client_secret", clientSecret)
    longLivedUrl.searchParams.set("access_token", shortLived.access_token)
    const longLivedResponse = await fetch(longLivedUrl, { signal: AbortSignal.timeout(30_000) })
    const longLived = await longLivedResponse.json().catch(() => ({})) as {
      access_token?: string
      expires_in?: number
      error?: { message?: string }
    }
    if (!longLivedResponse.ok || !longLived.access_token) {
      throw new Error(longLived.error?.message ?? "Instagram long-lived-token exchange failed.")
    }

    const profile = await requestGraph({
      path: "/me?fields=id,username,name,account_type,profile_picture_url",
      accessToken: longLived.access_token,
    })
    return {
      accessToken: longLived.access_token,
      instagramAccountId: String(profile.id ?? shortLived.user_id),
      username: profile.username as string | undefined,
      displayName: profile.name as string | undefined,
      accountType: profile.account_type as string | undefined,
      profileImageUrl: profile.profile_picture_url as string | undefined,
      expiresAt: longLived.expires_in
        ? new Date(Date.now() + Number(longLived.expires_in) * 1_000).toISOString()
        : undefined,
      scopes: [...INSTAGRAM_SCOPES],
    }
  }

  static async getContainerStatus(containerId: string, accessToken: string) {
    return requestGraph({
      path: `/${encodeURIComponent(containerId)}?fields=status_code,status`,
      accessToken,
    })
  }

  static async verifyConnection(accessToken: string) {
    return requestGraph({
      path: "/me?fields=id,username,name,account_type",
      accessToken,
    })
  }

  static async revokeAccess(accessToken: string) {
    await requestGraph({ path: "/me/permissions", accessToken, method: "DELETE" })
  }

  static async createContainer(input: {
    content: MarketingContent
    mediaAssets: MarketingAsset[]
    accessToken: string
    instagramAccountId: string
  }) {
    const caption = [input.content.caption, input.content.hashtags.join(" ")]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 2_200)
    if (!caption) throw new Error("Instagram publishing requires a caption.")

    const endpoint = `/${encodeURIComponent(input.instagramAccountId)}/media`
    const body = new URLSearchParams({ caption })
    const assets = input.mediaAssets

    if (input.content.contentType === "reel") {
      const reel = assets.find(asset => asset.mediaType === "video")
      if (!reel) throw new Error("An approved Reel requires a rendered MP4.")
      body.set("media_type", "REELS")
      body.set("video_url", mediaUrl(reel))
      body.set("share_to_feed", "true")
    } else if (input.content.contentType === "carousel") {
      if (assets.length < 2 || assets.length > 10) {
        throw new Error("An Instagram carousel requires 2–10 approved media items.")
      }
      const children = await Promise.all(assets.map(async asset => {
        const child = new URLSearchParams({ is_carousel_item: "true" })
        child.set(asset.mediaType === "video" ? "video_url" : "image_url", mediaUrl(asset))
        if (asset.mediaType === "video") child.set("media_type", "VIDEO")
        const container = await requestGraph({ path: endpoint, accessToken: input.accessToken, method: "POST", body: child })
        return String(container.id)
      }))
      body.set("media_type", "CAROUSEL")
      body.set("children", children.join(","))
    } else if (input.content.contentType === "story") {
      const story = assets[0]
      if (!story) throw new Error("An Instagram Story requires approved media.")
      body.set("media_type", "STORIES")
      body.set(story.mediaType === "video" ? "video_url" : "image_url", mediaUrl(story))
    } else {
      const image = assets.find(asset => asset.mediaType === "image")
      if (!image) throw new Error("An image post requires an approved image.")
      body.set("image_url", mediaUrl(image))
      if (input.content.altText) body.set("alt_text", input.content.altText.slice(0, 1_000))
    }

    const container = await requestGraph({ path: endpoint, accessToken: input.accessToken, method: "POST", body })
    if (!container.id) throw new Error("Instagram did not return a media-container ID.")
    return { containerId: String(container.id), diagnostics: container }
  }

  static async publishContainer(input: {
    instagramAccountId: string
    accessToken: string
    containerId: string
  }) {
    const body = new URLSearchParams({ creation_id: input.containerId })
    const publication = await requestGraph({
      path: `/${encodeURIComponent(input.instagramAccountId)}/media_publish`,
      accessToken: input.accessToken,
      method: "POST",
      body,
    })
    if (!publication.id) throw new Error("Instagram did not return a publication ID.")
    return { publicationId: String(publication.id), diagnostics: publication }
  }

  static async getPublicationPermalink(publicationId: string, accessToken: string) {
    const response = await requestGraph({
      path: `/${encodeURIComponent(publicationId)}?fields=permalink`,
      accessToken,
    })
    const permalink = response.permalink as string | undefined
    return permalink?.startsWith("https://www.instagram.com/") ? permalink : undefined
  }
}
