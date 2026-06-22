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
  const secret = getSecret();

  try {
    const result = await jwtVerify(token, secret);
    const { userId } = result.payload;
    if (typeof userId !== "string" || userId.length === 0) {
      return null;
    }

    return { userId };
  } catch {
    return null;
  }
}
