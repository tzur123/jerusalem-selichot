import { describe, expect, it } from "vitest";
import { generateQrToken, hashQrToken } from "./token";

describe("generateQrToken", () => {
  it("generates URL-safe tokens with no padding characters", () => {
    const token = generateQrToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates unique tokens across calls", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateQrToken()));
    expect(tokens.size).toBe(50);
  });
});

describe("hashQrToken", () => {
  it("is deterministic for the same token + pepper", async () => {
    const a = await hashQrToken("abc123", "pepper");
    const b = await hashQrToken("abc123", "pepper");
    expect(a).toBe(b);
  });

  it("produces a 64-char lowercase hex SHA-256 digest", async () => {
    const hash = await hashQrToken("abc123", "pepper");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes when the pepper changes", async () => {
    const a = await hashQrToken("abc123", "pepper-1");
    const b = await hashQrToken("abc123", "pepper-2");
    expect(a).not.toBe(b);
  });

  it("changes when the token changes", async () => {
    const a = await hashQrToken("token-a", "pepper");
    const b = await hashQrToken("token-b", "pepper");
    expect(a).not.toBe(b);
  });
});
