import { NextResponse } from "next/server";
import {
  CAFE24_OAUTH_STATE_COOKIE,
  exchangeCafe24CodeForToken,
  verifyCafe24OAuthState
} from "@/lib/cafe24";

export const runtime = "nodejs";

function adminCafe24Url(error?: string) {
  const url = new URL("/admin/cafe24", process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000");
  if (error) url.searchParams.set("error", error);
  return url;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const expectedState = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${CAFE24_OAUTH_STATE_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");

  if (!code || !verifyCafe24OAuthState({ state, expectedState })) {
    return NextResponse.redirect(adminCafe24Url("invalid-oauth-state"));
  }

  try {
    await exchangeCafe24CodeForToken({ code });
    const response = NextResponse.redirect(adminCafe24Url());
    response.cookies.set(CAFE24_OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    return response;
  } catch {
    return NextResponse.redirect(adminCafe24Url("token-exchange-failed"));
  }
}
