export type BrandLogoInspection = {
  mimeType: "image/png" | "image/webp"
  width: number
  height: number
  aspectRatio: number
  hasAlpha: boolean
}

function fail(message: string): never {
  throw new Error(message)
}

function littleEndian24(bytes: Uint8Array, offset: number) {
  return bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16)
}

function inspectPng(bytes: Uint8Array): BrandLogoInspection {
  if (bytes.length < 29 || ![137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) {
    return fail("The uploaded logo is not a valid PNG image.")
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  const colorType = bytes[25]
  if (!width || !height) return fail("The uploaded PNG logo has invalid dimensions.")
  return {
    mimeType: "image/png",
    width,
    height,
    aspectRatio: Number((width / height).toFixed(6)),
    hasAlpha: colorType === 4 || colorType === 6,
  }
}

function inspectWebp(bytes: Uint8Array): BrandLogoInspection {
  const riff = String.fromCharCode(...bytes.slice(0, 4))
  const webp = String.fromCharCode(...bytes.slice(8, 12))
  if (bytes.length < 30 || riff !== "RIFF" || webp !== "WEBP") {
    return fail("The uploaded logo is not a valid WebP image.")
  }
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const chunk = String.fromCharCode(...bytes.slice(offset, offset + 4))
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4)
    const size = view.getUint32(0, true)
    const data = offset + 8
    if (data + size > bytes.length) return fail("The uploaded WebP logo is truncated.")
    if (chunk === "VP8X" && size >= 10) {
      const width = littleEndian24(bytes, data + 4) + 1
      const height = littleEndian24(bytes, data + 7) + 1
      return { mimeType: "image/webp", width, height, aspectRatio: Number((width / height).toFixed(6)), hasAlpha: Boolean(bytes[data]! & 0x10) }
    }
    if (chunk === "VP8 " && size >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) {
      const width = (bytes[data + 6]! | (bytes[data + 7]! << 8)) & 0x3fff
      const height = (bytes[data + 8]! | (bytes[data + 9]! << 8)) & 0x3fff
      return { mimeType: "image/webp", width, height, aspectRatio: Number((width / height).toFixed(6)), hasAlpha: false }
    }
    if (chunk === "VP8L" && size >= 5 && bytes[data] === 0x2f) {
      const bits = bytes[data + 1]! | (bytes[data + 2]! << 8) | (bytes[data + 3]! << 16) | (bytes[data + 4]! << 24)
      const width = (bits & 0x3fff) + 1
      const height = ((bits >> 14) & 0x3fff) + 1
      return { mimeType: "image/webp", width, height, aspectRatio: Number((width / height).toFixed(6)), hasAlpha: Boolean((bits >> 28) & 1) }
    }
    offset = data + size + (size % 2)
  }
  return fail("The uploaded WebP logo does not contain decodable dimensions.")
}

/**
 * Server-side byte validation for the private logo bucket. It deliberately
 * does not rely on filename or client-supplied MIME metadata.
 */
export function inspectBrandLogo(bytes: Uint8Array): BrandLogoInspection {
  const inspection = bytes[0] === 137 ? inspectPng(bytes) : inspectWebp(bytes)
  if (inspection.width < 16 || inspection.height < 16) {
    return fail("Brand logos must be at least 16×16 pixels.")
  }
  if (Math.max(inspection.width / inspection.height, inspection.height / inspection.width) > 12) {
    return fail("Brand logo aspect ratio is too extreme for deterministic placement.")
  }
  return inspection
}
