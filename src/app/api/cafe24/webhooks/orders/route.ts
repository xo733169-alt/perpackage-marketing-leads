import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  CAFE24_LINK_SOURCE_WEBHOOK,
  extractCafe24OrderInfo,
  fetchCafe24OrderDetail,
  getCafe24ConfigStatus,
  getCafe24WebhookAuthFailureReason,
  inspectCafe24WebhookAuthHeaders,
  isCafe24TestWebhookPayload,
  linkCafe24OrderToUploadProject,
  redactSensitivePayload,
  verifyCafe24WebhookRequest
} from "@/lib/cafe24";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isDuplicateWebhookEvent(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function json(status: string, httpStatus = 200, extra?: Record<string, unknown>) {
  return NextResponse.json({ status, ...extra }, { status: httpStatus });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!verifyCafe24WebhookRequest({ rawBody, headers: request.headers })) {
    const authInspection = inspectCafe24WebhookAuthHeaders(request.headers);
    console.warn("[api/cafe24/webhooks/orders] unauthorized", {
      reason: getCafe24WebhookAuthFailureReason({ headers: request.headers }),
      directTokenHeaderNames: authInspection.directTokenHeaderNames,
      signatureHeaderNames: authInspection.signatureHeaderNames,
      unsupportedCafe24HeaderNames: authInspection.unsupportedCafe24HeaderNames,
      receivedHeaderNames: authInspection.receivedHeaderNames
    });
    return json("UNAUTHORIZED", 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json("INVALID_JSON", 400);
  }

  const configStatus = getCafe24ConfigStatus();
  const fallbackMallId = process.env.CAFE24_MALL_ID?.trim() || null;
  let orderInfo = extractCafe24OrderInfo(payload, fallbackMallId);
  const resolvedMallId = orderInfo.mallId?.trim() || fallbackMallId;
  let eventId: string | null = null;

  try {
    const event = await prisma.cafe24WebhookEvent.create({
      data: {
        eventType: orderInfo.eventType ?? null,
        eventId: orderInfo.eventId ?? null,
        mallId: resolvedMallId,
        orderId: orderInfo.orderId ?? null,
        orderNo: orderInfo.orderNo ?? null,
        uploadCode: orderInfo.uploadCode ?? null,
        payloadJson: redactSensitivePayload(payload),
        status: "RECEIVED"
      },
      select: { id: true }
    });
    eventId = event.id;
  } catch (error) {
    if (isDuplicateWebhookEvent(error)) {
      return json("DUPLICATE");
    }
    return json("EVENT_SAVE_FAILED", 200);
  }

  if (!eventId) {
    return json("EVENT_SAVE_FAILED", 200);
  }

  if (isCafe24TestWebhookPayload(payload)) {
    const message = "Cafe24 test payload cannot be fetched as real order.";
    await prisma.cafe24WebhookEvent.update({
      where: { id: eventId },
      data: {
        status: "SKIPPED_TEST_PAYLOAD",
        errorMessage: message,
        processedAt: new Date()
      }
    });
    console.info("[api/cafe24/webhooks/orders] skipped test payload", {
      mallId: resolvedMallId,
      tokenLookupMallId: resolvedMallId,
      tokenLookupAttempted: false
    });
    return json("SKIPPED_TEST_PAYLOAD", 200, { message });
  }

  if (!orderInfo.uploadCode && orderInfo.orderId && !configStatus.missing.length) {
    try {
      const detail = await fetchCafe24OrderDetail({
        orderId: orderInfo.orderId,
        mallId: resolvedMallId
      });
      const detailInfo = extractCafe24OrderInfo(detail, resolvedMallId);
      orderInfo = {
        ...orderInfo,
        ...Object.fromEntries(Object.entries(detailInfo).filter(([, value]) => value !== null && value !== undefined))
      };

      await prisma.cafe24WebhookEvent.update({
        where: { id: eventId },
        data: {
          orderId: orderInfo.orderId ?? null,
          orderNo: orderInfo.orderNo ?? null,
          uploadCode: orderInfo.uploadCode ?? null
        }
      });
    } catch (error) {
      await prisma.cafe24WebhookEvent.update({
        where: { id: eventId },
        data: {
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Cafe24 order detail request failed.",
          processedAt: new Date()
        }
      });
      return json("ORDER_DETAIL_SYNC_FAILED");
    }
  }

  try {
    const result = await linkCafe24OrderToUploadProject({
      uploadCode: orderInfo.uploadCode,
      mallId: orderInfo.mallId?.trim() || resolvedMallId,
      orderId: orderInfo.orderId,
      orderNo: orderInfo.orderNo,
      memberId: orderInfo.memberId,
      orderMemo: orderInfo.orderMemo,
      source: CAFE24_LINK_SOURCE_WEBHOOK,
      webhookEventId: eventId
    });

    return json(result.status, 200, {
      projectId: result.projectId,
      message: result.message
    });
  } catch (error) {
    await prisma.cafe24WebhookEvent.update({
      where: { id: eventId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Webhook processing failed.",
        processedAt: new Date()
      }
    });
    return json("FAILED");
  }
}
