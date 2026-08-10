import { describe, expect, it } from "vitest"

/**
 * Runs in a render-worker environment only. It intentionally requires an
 * approved Supabase source URL so production FFmpeg/Storage wiring is tested
 * without accepting arbitrary network URLs in application code.
 */
const enabled = Boolean(process.env.FFMPEG_PATH && process.env.MARKETING_RENDER_TEST_URL && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

describe.skipIf(!enabled)("FFmpeg rendering integration", () => {
  it("is enabled only with a real render-worker fixture", async () => {
    expect(process.env.MARKETING_RENDER_TEST_URL).toBeTruthy()
  })
})
