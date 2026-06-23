import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth/cookies";
import { sessionCookieName } from "@/lib/auth/current-user";

function redirectToLogin(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(sessionCookieName, "", getSessionCookieOptions(0));

  return response;
}

export function GET(request: Request) {
  return redirectToLogin(request);
}

export function POST(request: Request) {
  return redirectToLogin(request);
}
