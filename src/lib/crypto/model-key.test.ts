import { describe, expect, it, vi } from "vitest";
import { decryptModelKey, encryptModelKey } from "./model-key";

describe("model-key encryption", () => {
  it("encrypts and decrypts a key", () => {
    vi.stubEnv("MODEL_KEY_ENCRYPTION_SECRET", Buffer.alloc(32, 7).toString("base64"));

    const encrypted = encryptModelKey("sk-test");

    expect(encrypted).not.toBe("sk-test");
    expect(decryptModelKey(encrypted)).toBe("sk-test");
  });

  it("rejects secrets that do not decode to 32 bytes", () => {
    vi.stubEnv("MODEL_KEY_ENCRYPTION_SECRET", Buffer.alloc(31, 7).toString("base64"));

    expect(() => encryptModelKey("sk-test")).toThrow(
      "MODEL_KEY_ENCRYPTION_SECRET must decode to 32 bytes"
    );
  });
});
