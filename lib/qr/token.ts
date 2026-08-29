import { generateRandomToken, sha256Hex } from "@/lib/crypto/hash";

/**
 * QR token generation & hashing.
 *
 * Raw tokens are only ever shown once (embedded in the printed QR / URL).
 * The database stores only `sha256(token + pepper)` in `qr_codes.token_hash`.
 */

/** Cryptographically secure random URL-safe token, e.g. for `/q/<token>`. */
export function generateQrToken(byteLength = 24): string {
  return generateRandomToken(byteLength);
}

/** SHA-256(token + pepper), returned as a lowercase hex string. */
export function hashQrToken(token: string, pepper: string): Promise<string> {
  return sha256Hex(`${token}${pepper}`);
}
