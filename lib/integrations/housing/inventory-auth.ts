import { timingSafeEqual } from "node:crypto"

export function readHousingBearerToken(request: Request) {
  const authorization = request.headers.get("authorization")
  const match = authorization?.match(/^Bearer\s+(.+)$/i)
  return match?.[1] ?? null
}

export function hasValidHousingInventoryKey(received: string | null) {
  const expected = process.env.HOUSING_INVENTORY_API_KEY
  if (!expected || !received) return false

  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)
  return expectedBuffer.byteLength === receivedBuffer.byteLength
    && timingSafeEqual(expectedBuffer, receivedBuffer)
}
