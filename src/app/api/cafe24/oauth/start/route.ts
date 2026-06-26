import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  buildCafe24OAuthAuthorizeUrl,
  CAFE24_OAUTH_STATE_COOKIE,
  createCafe24OAuthState,
  getCafe24ConfigStatus
} from "@/lib/cafe24";

export const runtime = "nodejs";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000"));
  }

  const status = getCafe24ConfigStatus();
  if (status.missing.length) {
    const url = new URL("/admin/cafe24", process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000");
    url.searchParams.set("error", "missing-config");
    return NextResponse.redirect(url);
  }

  const state = createCafe24OAuthState();
  const response = NextResponse.redirect(buildCafe24OAuthAuthorizeUrl({ state }));

  response.cookies.set(CAFE24_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
