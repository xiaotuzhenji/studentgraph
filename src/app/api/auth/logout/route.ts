import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth/cookies";
import { sessionCookieName } from "@/lib/auth/current-user";

function redirectToLogin(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;
  const response = NextResponse.redirect(new URL("/login", origin), 303);
  response.cookies.set(sessionCookieName, "", getSessionCookieOptions(0));

  return response;
}

export function GET(request: Request) {
  return redirectToLogin(request);
}

export function POST(request: Request) {
  return redirectToLogin(request);
}
