export function shouldUseSecureSessionCookie() {
  return process.env.SESSION_COOKIE_SECURE === "true";
}

export function getSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureSessionCookie(),
    path: "/",
    maxAge
  };
}
