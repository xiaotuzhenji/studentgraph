import crypto from "node:crypto";

function getKey() {
  const raw = process.env.MODEL_KEY_ENCRYPTION_SECRET;
  if (!raw) {
    throw new Error("MODEL_KEY_ENCRYPTION_SECRET is required");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("MODEL_KEY_ENCRYPTION_SECRET must decode to 32 bytes");
  }

  return key;
}

export function encryptModelKey(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(".");
}

export function decryptModelKey(value: string) {
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64")),
    decipher.final()
  ]).toString("utf8");
}
