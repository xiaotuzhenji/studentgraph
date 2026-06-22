import { afterEach, describe, expect, it, vi } from "vitest";

describe("db", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("throws a clear error when DATABASE_URL is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    await expect(import("./db")).rejects.toThrow("DATABASE_URL is required");
  });

  it("constructs the Prisma client for a local PostgreSQL DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/studentgraph");

    await expect(import("./db")).resolves.toHaveProperty("db");
  });
});
