import { NextResponse, type NextRequest } from "next/server";
import {
  getSiteAccessCookieName,
  isSiteAccessBypassPath,
  isSiteAccessEnabled,
  sanitizeSiteAccessNextPath,
  verifySiteAccessCookieValue
} from "@/lib/site-access";

export async function middleware(request: NextRequest) {
  if (!isSiteAccessEnabled()) {
    return NextResponse.next();
  }

  const { pathname, search } = request.nextUrl;

  if (isSiteAccessBypassPath(pathname)) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(getSiteAccessCookieName())?.value;
  const hasValidAccess = await verifySiteAccessCookieValue(cookieValue);

  if (hasValidAccess) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "접근 권한이 필요합니다." }, { status: 401 });
  }

  const accessUrl = request.nextUrl.clone();
  accessUrl.pathname = "/access";
  accessUrl.search = "";
  accessUrl.searchParams.set("next", sanitizeSiteAccessNextPath(`${pathname}${search}`));

  return NextResponse.redirect(accessUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
