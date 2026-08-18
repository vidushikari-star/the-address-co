import { afterEach, describe, expect, it, vi } from "vitest"

import { InstagramCarouselChildContainerError, InstagramService } from "@/lib/marketing/services/instagram-service"

const originalFetch = global.fetch

afterEach(() => { global.fetch = originalFetch })

describe("InstagramService", () => {
  it("rejects a tampered OAuth state before any token exchange", () => {
    process.env.MARKETING_OAUTH_STATE_SECRET = "a-strong-state-secret-with-at-least-32-chars"
    const state = InstagramService.createOAuthState()
    expect(InstagramService.verifyAuthorizationState(state)).toBeTruthy()
    expect(() => InstagramService.verifyAuthorizationState(`${state}tampered`)).toThrow("Invalid Instagram OAuth state")
  })

  it("uses a bearer token server-side to poll a media container", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status_code: "FINISHED", status: "Finished" }), { status: 200 }))
    global.fetch = fetchMock
    process.env.META_GRAPH_BASE_URL = "https://graph.instagram.com"
    process.env.META_GRAPH_API_VERSION = "v25.0"

    await expect(InstagramService.getContainerStatus("container-1", "server-token")).resolves.toMatchObject({ status_code: "FINISHED" })
    expect(String(fetchMock.mock.calls[0][0])).toContain("container-1")
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer server-token" })
  })

  it("creates official image and Reel media containers without exposing a token in the URL", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "image-container" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "reel-container" }), { status: 200 }))
    global.fetch = fetchMock
    const content = {
      id: "content-1", contentType: "single_image" as const, caption: "Caption", hashtags: ["#tag"], altText: "A home",
    }
    const image = { id: "asset-1", contentId: "content-1", kind: "original_reference" as const, mediaType: "image" as const, sourceUrl: "https://crm.example/image.jpg", metadata: {}, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" }
    await InstagramService.createContainer({ content: content as never, mediaAssets: [image], accessToken: "server-token", instagramAccountId: "ig-user" })
    await InstagramService.createContainer({ content: { ...content, contentType: "reel" } as never, mediaAssets: [{ ...image, kind: "rendered_media", mediaType: "video", storagePath: "reel.mp4", signedUrl: "https://project.supabase.co/signed.mp4" }], accessToken: "server-token", instagramAccountId: "ig-user" })

    const imageBody = String((fetchMock.mock.calls[0][1] as RequestInit).body)
    const reelBody = String((fetchMock.mock.calls[1][1] as RequestInit).body)
    expect(imageBody).toContain("image_url=https%3A%2F%2Fcrm.example%2Fimage.jpg")
    expect(reelBody).toContain("media_type=REELS")
    expect(reelBody).toContain("video_url=https%3A%2F%2Fproject.supabase.co%2Fsigned.mp4")
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("server-token")
  })

  it("rejects Carousel video media before contacting Meta", async () => {
    const fetchMock = vi.fn()
    global.fetch = fetchMock
    const content = { id: "content-1", contentType: "carousel" as const, caption: "Caption", hashtags: ["#tag"], altText: null }
    const image = { id: "asset-image", contentId: "content-1", kind: "original_reference" as const, mediaType: "image" as const, sourceUrl: "https://crm.example/image.jpg", metadata: {}, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" }
    const video = { ...image, id: "asset-video", mediaType: "video" as const, sourceUrl: "https://crm.example/tour.mp4" }

    await expect(InstagramService.createContainer({ content: content as never, mediaAssets: [image, video], accessToken: "server-token", instagramAccountId: "ig-user" }))
      .rejects.toThrow("images only")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("uses the Meta STORIES path with the rendered Story image and no detached feed caption", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "story-container" }), { status: 200 }))
    global.fetch = fetchMock
    const content = { id: "content-1", contentType: "story" as const, caption: "A feed caption must not be used", hashtags: ["#tag"], altText: null }
    const story = { id: "story-1", contentId: "content-1", kind: "rendered_media" as const, mediaType: "image" as const, storagePath: "story.jpg", signedUrl: "https://project.supabase.co/signed-story.jpg", metadata: { instagramFormat: "story", width: 1080, height: 1920 }, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" }

    await InstagramService.createContainer({ content: content as never, mediaAssets: [story], accessToken: "server-token", instagramAccountId: "ig-user" })

    const body = String((fetchMock.mock.calls[0][1] as RequestInit).body)
    expect(body).toContain("media_type=STORIES")
    expect(body).toContain("image_url=https%3A%2F%2Fproject.supabase.co%2Fsigned-story.jpg")
    expect(body).not.toContain("caption")
  })

  it("retains created child IDs if a later Carousel child fails", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "child-1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "Unsupported image", code: 100 } }), { status: 400 }))
    global.fetch = fetchMock
    const content = { id: "content-1", contentType: "carousel" as const, caption: "Caption", hashtags: ["#tag"], altText: null }
    const image = { id: "asset-image", contentId: "content-1", kind: "original_reference" as const, mediaType: "image" as const, sourceUrl: "https://crm.example/image.jpg", metadata: {}, sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z" }

    await expect(InstagramService.createContainer({
      content: content as never,
      mediaAssets: [image, { ...image, id: "asset-image-2", sourceUrl: "https://crm.example/image-2.jpg" }],
      accessToken: "server-token",
      instagramAccountId: "ig-user",
    })).rejects.toMatchObject({
      name: InstagramCarouselChildContainerError.name,
      childContainerIds: ["child-1"],
    })
  })

  it("classifies Meta authentication failures without persisting the raw API message", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: "Invalid OAuth 2.0 Access Token: server-token", code: 190 } }), { status: 400 }))

    await expect(InstagramService.verifyConnection("server-token")).rejects.toMatchObject({
      name: "InstagramApiError",
      statusCode: 400,
      code: 190,
      message: "Instagram authentication failed. Reconnect the account.",
    })
  })
})
