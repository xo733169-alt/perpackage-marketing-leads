import { NextResponse } from "next/server";
import { isAdminPasswordConfigured, setAdminSessionCookie, validateAdminPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };

  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { message: "ADMIN_PASSWORD 환경 변수를 먼저 설정해주세요." },
      { status: 500 }
    );
  }

  if (!body.password || !validateAdminPassword(body.password)) {
    return NextResponse.json({ message: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  setAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
