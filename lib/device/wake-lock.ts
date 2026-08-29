"use client";

let sentinel: WakeLockSentinel | null = null;

export function isWakeLockSupported(): boolean {
  return typeof navigator !== "undefined" && "wakeLock" in navigator;
}

/** Must be called from within a user gesture handler. Fails silently if unsupported. */
export async function requestWakeLock(): Promise<void> {
  if (!isWakeLockSupported()) return;
  try {
    sentinel = await (navigator as Navigator & { wakeLock: WakeLock }).wakeLock.request("screen");
  } catch {
    sentinel = null;
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    await sentinel?.release();
  } catch {
    // ignore
  } finally {
    sentinel = null;
  }
}

type WakeLockSentinel = { release: () => Promise<void> };
type WakeLock = { request: (type: "screen") => Promise<WakeLockSentinel> };
