import { describe, expect, it } from "vitest"

import { TokenCryptoService } from "@/lib/marketing/services/token-crypto-service"

describe("TokenCryptoService", () => {
  it("encrypts server-side credentials without retaining plaintext", () => {
    process.env.MARKETING_TOKEN_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64")
    const ciphertext = TokenCryptoService.encrypt("never-send-this-token-to-the-browser")
    expect(ciphertext).not.toContain("never-send-this-token-to-the-browser")
    expect(TokenCryptoService.decrypt(ciphertext)).toBe("never-send-this-token-to-the-browser")
  })
})
