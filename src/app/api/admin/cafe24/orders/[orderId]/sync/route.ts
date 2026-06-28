import { NextResponse } from "next/server";
import { isAdminAuthenticated, isAllowedMutationOrigin } from "@/lib/auth";
import {
  CAFE24_LINK_SOURCE_API,
  extractCafe24OrderInfo,
  extractCafe24OrderSummary,
  fetchCafe24OrderDetail,
  findCafe24OrderMatchedProject,
  linkCafe24OrderToUploadProject
} from "@/lib/cafe24";
import { prisma } from "@/lib/prisma";

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
  const tokenLookupMallId = body.mallId?.trim() || process.env.CAFE24_MALL_ID?.trim() || null;

  try {
    const detail = await fetchCafe24OrderDetail({
      orderId,
      mallId: tokenLookupMallId
    });
    const orderInfo = extractCafe24OrderInfo(detail, tokenLookupMallId);
    const matchInput = {
      uploadCode: orderInfo.uploadCode,
      mallId: orderInfo.mallId ?? tokenLookupMallId,
      orderId: orderInfo.orderId ?? orderId,
      orderNo: orderInfo.orderNo,
      memberId: orderInfo.memberId,
      orderMemo: orderInfo.orderMemo,
      source: CAFE24_LINK_SOURCE_API
    };
    const matchedProject = await findCafe24OrderMatchedProject(matchInput);
    const orderSummary = extractCafe24OrderSummary(detail, tokenLookupMallId, matchedProject);
    const result = await linkCafe24OrderToUploadProject(matchInput);
    const linkedProject = result.projectId
      ? await prisma.uploadProject.findUnique({
        where: { id: result.projectId },
        select: {
          id: true,
          uploadCode: true,
          companyName: true,
          customerName: true
        }
      })
      : matchedProject
        ? {
          id: matchedProject.projectId,
          uploadCode: matchedProject.uploadCode,
          companyName: matchedProject.companyName,
          customerName: matchedProject.customerName
        }
        : null;

    return NextResponse.json({
      ok: true,
      tokenLookupMallId,
      orderId,
      order: {
        ...orderSummary,
        orderId: orderSummary.orderId ?? orderInfo.orderId ?? orderId,
        orderNo: orderSummary.orderNo ?? orderInfo.orderNo ?? orderInfo.orderId ?? orderId,
        uploadCode: orderSummary.uploadCode ?? orderInfo.uploadCode ?? null,
        hasUploadCode: Boolean(orderSummary.uploadCode ?? orderInfo.uploadCode)
      },
      linkedProject,
      result
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Cafe24 주문 동기화에 실패했습니다.",
        tokenLookupMallId,
        orderId
      },
      { status: 400 }
    );
  }
}
