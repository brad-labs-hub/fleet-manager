import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

// Encrypts third-party OAuth access tokens before they are placed in cookies.
// A raw provider token in a cookie is a bearer credential to the user's Drive;
// AES-256-GCM with a server-only key keeps it opaque to the browser and to
// anyone who exfiltrates the cookie without also holding the key.

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;

function getKey(): Buffer | null {
  const secret = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 16) return null;
  // Normalize arbitrary-length secrets to a 32-byte key.
  return createHash("sha256").update(secret).digest();
}

export function isTokenEncryptionConfigured(): boolean {
  return getKey() !== null;
}

/**
 * Encrypts a plaintext token. Returns base64(iv | authTag | ciphertext),
 * or null if no encryption key is configured (caller should refuse to store).
 */
export function encryptToken(plaintext: string): string | null {
  const key = getKey();
  if (!key) return null;

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

/**
 * Reverses encryptToken. Returns null on any failure (bad key, tampering,
 * legacy plaintext value), so callers treat the token as unavailable.
 */
export function decryptToken(payload: string): string | null {
  const key = getKey();
  if (!key) return null;

  try {
    const buf = Buffer.from(payload, "base64");
    if (buf.length <= IV_BYTES + TAG_BYTES) return null;
    const iv = buf.subarray(0, IV_BYTES);
    const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = buf.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
