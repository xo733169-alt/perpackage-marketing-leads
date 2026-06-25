import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { fetchPlugoRequests, PlugoConfigError, PlugoUpstreamError } from "@/lib/plugo";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extra }, { status });
}

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return jsonError("인증이 필요합니다.", 401);
  }

  const { searchParams } = new URL(request.url);

  try {
    const data = await fetchPlugoRequests({ searchParams });
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    if (error instanceof PlugoConfigError) {
      return jsonError("플러그 API 환경변수를 확인해 주세요.", 503, {
        missing: error.missing,
        errors: error.errors
      });
    }

    if (error instanceof PlugoUpstreamError) {
      return jsonError("플러그 API 요청에 실패했습니다.", 502, {
        upstreamStatus: error.status
      });
    }

    if (error instanceof Error && error.name === "AbortError") {
      return jsonError("플러그 API 응답 시간이 초과되었습니다.", 504);
    }

    return jsonError("플러그 의뢰 목록을 불러오지 못했습니다.", 500);
  }
}
