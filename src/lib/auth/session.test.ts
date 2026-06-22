/* @vitest-environment node */

import { describe, expect, it, vi } from "vitest";
import { createSessionToken, readSessionToken } from "./session";

vi.stubEnv("SESSION_SECRET", "test-secret-that-is-long-enough-for-jose");

describe("session helpers", () => {
  it("round trips a user id", async () => {
    const token = await createSessionToken("user_123");
    const session = await readSessionToken(token);

    expect(session?.userId).toBe("user_123");
  });
});
