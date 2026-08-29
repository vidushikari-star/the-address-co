import { describe, expect, it } from "vitest"

import { inspectBrandLogo } from "@/lib/marketing/brand-asset-validation"

function png(width: number, height: number, colorType = 6) {
  const bytes = new Uint8Array(29)
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10])
  const view = new DataView(bytes.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  bytes[25] = colorType
  return bytes
}

function webpVp8x(width: number, height: number, alpha = true) {
  const bytes = new Uint8Array(30)
  bytes.set([..."RIFF"].map(char => char.charCodeAt(0)), 0)
  bytes.set([..."WEBP"].map(char => char.charCodeAt(0)), 8)
  bytes.set([..."VP8X"].map(char => char.charCodeAt(0)), 12)
  new DataView(bytes.buffer).setUint32(16, 10, true)
  bytes[20] = alpha ? 0x10 : 0
  const w = width - 1
  const h = height - 1
  bytes.set([w & 0xff, (w >> 8) & 0xff, (w >> 16) & 0xff], 24)
  bytes.set([h & 0xff, (h >> 8) & 0xff, (h >> 16) & 0xff], 27)
  return bytes
}

describe("private brand logo validation", () => {
  it("derives PNG dimensions and alpha from actual image bytes", () => {
    expect(inspectBrandLogo(png(320, 80))).toEqual({ mimeType: "image/png", width: 320, height: 80, aspectRatio: 4, hasAlpha: true })
  })

  it("derives WebP dimensions and preserves alpha metadata", () => {
    expect(inspectBrandLogo(webpVp8x(200, 100))).toEqual({ mimeType: "image/webp", width: 200, height: 100, aspectRatio: 2, hasAlpha: true })
  })

  it("rejects non-image bytes and extreme logo aspect ratios", () => {
    expect(() => inspectBrandLogo(new Uint8Array([1, 2, 3]))).toThrow("valid WebP")
    expect(() => inspectBrandLogo(png(1_300, 64))).toThrow("aspect ratio")
  })
})
