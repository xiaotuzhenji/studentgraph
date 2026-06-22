/* @vitest-environment node */

import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, readSessionToken } from "./session";

const secret = "test-secret-that-is-long-enough-for-jose";
const encoder = new TextEncoder();

async function createToken(payload: Record<string, unknown>, signingSecret = secret) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .sign(encoder.encode(signingSecret));
}

describe("session helpers", () => {
  beforeEach(() => {
    vi.stubEnv("SESSION_SECRET", secret);
  });

  it("round trips a user id", async () => {
    const token = await createSessionToken("user_123");
    const session = await readSessionToken(token);

    expect(session?.userId).toBe("user_123");
  });

  it("returns null for a malformed token", async () => {
    await expect(readSessionToken("not-a-jwt")).resolves.toBeNull();
  });

  it("returns null for a token signed with the wrong secret", async () => {
    const token = await createSessionToken("user_123");
    vi.stubEnv("SESSION_SECRET", "different-secret-that-is-long-enough");

    await expect(readSessionToken(token)).resolves.toBeNull();
  });

  it("returns null when the token has no user id", async () => {
    const token = await createToken({});

    await expect(readSessionToken(token)).resolves.toBeNull();
  });

  it("returns null when the user id is not a string", async () => {
    const token = await createToken({ userId: 123 });

    await expect(readSessionToken(token)).resolves.toBeNull();
  });

  it("returns null when the user id is empty", async () => {
    const token = await createToken({ userId: "" });

    await expect(readSessionToken(token)).resolves.toBeNull();
  });

  it("throws when SESSION_SECRET is missing", async () => {
    vi.unstubAllEnvs();

    await expect(readSessionToken("not-a-jwt")).rejects.toThrow(
      "SESSION_SECRET is required",
    );
  });
});
