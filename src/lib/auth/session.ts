import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required");
  }
  return encoder.encode(secret);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function readSessionToken(token: string) {
  try {
    const result = await jwtVerify<{ userId: string }>(token, getSecret());
    return { userId: result.payload.userId };
  } catch {
    return null;
  }
}
