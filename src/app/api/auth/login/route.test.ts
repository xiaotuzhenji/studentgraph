/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn()
  }
}));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(async () => true)
}));
vi.mock("@/lib/auth/session", () => ({
  createSessionToken: vi.fn(async () => "session-token")
}));

describe("login route", () => {
  beforeEach(() => {
    vi.resetModules();
    db.user.findUnique.mockReset();
  });

  it("returns 400 for invalid JSON", async () => {
    const { POST } = await import("./route");
    const response = await POST(new Request("http://test.local", {
      method: "POST",
      body: "{"
    }));

    await expect(response.json()).resolves.toEqual({ error: "Invalid request body" });
    expect(response.status).toBe(400);
  });
});
