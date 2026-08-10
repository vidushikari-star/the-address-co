import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

function encryptionKey() {
  const encoded = process.env.MARKETING_TOKEN_ENCRYPTION_KEY
  if (!encoded) {
    throw new Error("MARKETING_TOKEN_ENCRYPTION_KEY is required before Instagram can be connected.")
  }

  const key = Buffer.from(encoded, "base64")
  if (key.byteLength !== 32) {
    throw new Error("MARKETING_TOKEN_ENCRYPTION_KEY must be a base64 encoded 32-byte key.")
  }

  return key
}

/** AES-256-GCM payload. Encryption is mandatory; plaintext tokens are never persisted. */
export class TokenCryptoService {
  static encrypt(value: string) {
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
    const tag = cipher.getAuthTag()
    return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
  }

  static decrypt(payload: string) {
    const [version, ivEncoded, tagEncoded, encryptedEncoded] = payload.split(".")
    if (version !== "v1" || !ivEncoded || !tagEncoded || !encryptedEncoded) {
      throw new Error("Stored Instagram token is malformed.")
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivEncoded, "base64url")
    )
    decipher.setAuthTag(Buffer.from(tagEncoded, "base64url"))
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedEncoded, "base64url")),
      decipher.final(),
    ]).toString("utf8")
  }
}
