import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import {
  CAFE24_LINK_SOURCE_API,
  extractCafe24OrderInfo,
  fetchCafe24OrderDetail,
  linkCafe24OrderToUploadProject
} from "@/lib/cafe24";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedMutationOrigin(request)) {
    return NextResponse.json({ message: "허용되지 않은 요청입니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({})) as { mallId?: string };
  const orderId = decodeURIComponent(params.orderId);

  try {
    const detail = await fetchCafe24OrderDetail({
      orderId,
      mallId: body.mallId
    });
    const orderInfo = extractCafe24OrderInfo(detail, body.mallId ?? process.env.CAFE24_MALL_ID ?? null);
    const result = await linkCafe24OrderToUploadProject({
      uploadCode: orderInfo.uploadCode,
      mallId: orderInfo.mallId,
      orderId: orderInfo.orderId ?? orderId,
      orderNo: orderInfo.orderNo,
      memberId: orderInfo.memberId,
      orderMemo: orderInfo.orderMemo,
      source: CAFE24_LINK_SOURCE_API
    });

    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Cafe24 주문 동기화에 실패했습니다." },
      { status: 400 }
    );
  }
}
