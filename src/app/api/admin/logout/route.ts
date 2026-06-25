import { NextResponse } from "next/server";
import { clearAdminSessionCookie, isAllowedMutationOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
