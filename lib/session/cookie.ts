import "server-only";
import { cookies } from "next/headers";
import { generateRandomToken, sha256Hex } from "@/lib/crypto/hash";
import { env } from "@/lib/config/env";

export const SESSION_COOKIE_NAME = "jslichot_tour_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Reads the opaque session key from the request cookie, if present. */
export async function readSessionKey(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Generates a new opaque session key and sets it as an HttpOnly cookie.
 * Only callable from a Server Action or Route Handler (Next.js constraint).
 */
export async function issueNewSessionKey(): Promise<string> {
  const key = generateRandomToken(32);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, key, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return key;
}

export async function clearSessionKey(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}

/** Hash stored in the database — never the raw cookie value. */
export function hashSessionKey(key: string): Promise<string> {
  return sha256Hex(`${key}${env.SESSION_HASH_SECRET}`);
}
