import { NextResponse } from "next/server";
import { isAllowedMutationOrigin } from "@/lib/auth";
import { clearSiteAccessCookie } from "@/lib/site-access";

export async function POST(request: Request) {
  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  clearSiteAccessCookie(response);

  return response;
}
