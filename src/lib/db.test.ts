import { afterEach, describe, expect, it, vi } from "vitest";

describe("db", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("constructs the Prisma client for a local PostgreSQL DATABASE_URL", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/studentgraph");

    await expect(import("./db")).resolves.toHaveProperty("db");
  });
});
