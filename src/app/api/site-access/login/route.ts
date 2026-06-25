import { NextResponse } from "next/server";
import { isAllowedMutationOrigin } from "@/lib/auth";
import {
  createSiteAccessCookieValue,
  isSiteAccessEnabled,
  isSiteAccessPasswordConfigured,
  sanitizeSiteAccessNextPath,
  setSiteAccessCookie,
  validateSiteAccessPassword
} from "@/lib/site-access";
import { siteAccessLoginSchema, toSiteAccessFieldErrors } from "@/lib/site-access-schema";

export async function POST(request: Request) {
  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = siteAccessLoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "입력 내용을 확인해 주세요.", fieldErrors: toSiteAccessFieldErrors(parsed.error) },
      { status: 400 }
    );
  }

  if (!isSiteAccessEnabled()) {
    return NextResponse.json({ ok: true, next: sanitizeSiteAccessNextPath(parsed.data.next) });
  }

  if (!isSiteAccessPasswordConfigured()) {
    return NextResponse.json(
      { message: "SITE_ACCESS_PASSWORD 환경 변수를 먼저 설정해 주세요." },
      { status: 500 }
    );
  }

  if (!validateSiteAccessPassword(parsed.data.password)) {
    return NextResponse.json({ message: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, next: sanitizeSiteAccessNextPath(parsed.data.next) });
  const cookieValue = await createSiteAccessCookieValue();
  setSiteAccessCookie(response, cookieValue);

  return response;
}
