import { afterEach, describe, expect, it, vi } from "vitest";
import { getSessionCookieOptions, shouldUseSecureSessionCookie } from "./cookies";

describe("session cookie options", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows disabling secure cookies for HTTP deployments", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_COOKIE_SECURE", "false");

    expect(shouldUseSecureSessionCookie()).toBe(false);
    expect(getSessionCookieOptions(3600).secure).toBe(false);
  });

  it("uses secure cookies in production by default", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(shouldUseSecureSessionCookie()).toBe(false);
  });

  it("uses secure cookies only when explicitly enabled", () => {
    vi.stubEnv("SESSION_COOKIE_SECURE", "true");

    expect(shouldUseSecureSessionCookie()).toBe(true);
  });
});
