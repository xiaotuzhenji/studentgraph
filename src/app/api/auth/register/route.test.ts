/* @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    findUnique: vi.fn()
  }
}));

vi.mock("@/lib/db", () => ({ db }));
vi.mock("@/lib/auth/password", () => ({
  hashPassword: vi.fn(async () => "hashed-password")
}));
vi.mock("@/lib/auth/session", () => ({
  createSessionToken: vi.fn(async () => "session-token")
}));

describe("register route", () => {
  beforeEach(() => {
    vi.resetModules();
    db.user.create.mockReset();
    db.user.findUnique.mockReset();
    db.user.findUnique.mockResolvedValue(null);
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

  it("returns 409 when create hits a duplicate email", async () => {
    db.user.create.mockRejectedValue({ code: "P2002" });

    const { POST } = await import("./route");
    const response = await POST(new Request("http://test.local", {
      method: "POST",
      body: JSON.stringify({
        email: "learner@example.com",
        password: "password-123456"
      })
    }));

    await expect(response.json()).resolves.toEqual({ error: "Email already registered" });
    expect(response.status).toBe(409);
  });
});
