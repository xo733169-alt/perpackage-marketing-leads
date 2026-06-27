import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import {
  CAFE24_LINK_SOURCE_WEBHOOK,
  appendCafe24WebhookDebugInfo,
  type Cafe24OrderDetailLookupStatus,
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

function buildWebhookDebug({
  orderInfo,
  resolvedMallId,
  status,
  message
}: {
  orderInfo: ReturnType<typeof extractCafe24OrderInfo>;
  resolvedMallId: string | null;
  status: Cafe24OrderDetailLookupStatus;
  message?: string | null;
}) {
  return {
    mallId: resolvedMallId,
    orderId: orderInfo.orderId ?? orderInfo.orderNo ?? null,
    eventType: orderInfo.eventType ?? orderInfo.eventId ?? null,
    tokenLookupMallId: resolvedMallId,
    orderDetailLookupStatus: status,
    orderDetailLookupMessage: message ?? null,
    orderDetailLookupAt: new Date().toISOString()
  };
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
  const isTestPayload = isCafe24TestWebhookPayload(payload);
  let payloadJson = appendCafe24WebhookDebugInfo(redactSensitivePayload(payload), buildWebhookDebug({
    orderInfo,
    resolvedMallId,
    status: isTestPayload ? "SKIPPED_TEST_PAYLOAD" : "NOT_ATTEMPTED",
    message: isTestPayload ? "Cafe24 test payload cannot be fetched as real order." : null
  }));
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
        payloadJson,
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

  if (isTestPayload) {
    const message = "Cafe24 test payload cannot be fetched as real order.";
    await prisma.cafe24WebhookEvent.update({
      where: { id: eventId },
      data: {
        status: "SKIPPED_TEST_PAYLOAD",
        errorMessage: message,
        payloadJson,
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
      payloadJson = appendCafe24WebhookDebugInfo(payloadJson, buildWebhookDebug({
        orderInfo,
        resolvedMallId,
        status: "ATTEMPTING",
        message: "Cafe24 order detail lookup started."
      }));
      await prisma.cafe24WebhookEvent.update({
        where: { id: eventId },
        data: { payloadJson }
      });
      console.info("[api/cafe24/webhooks/orders] order detail lookup started", {
        mallId: resolvedMallId,
        orderId: orderInfo.orderId,
        eventType: orderInfo.eventType ?? orderInfo.eventId ?? null,
        tokenLookupMallId: resolvedMallId
      });

      const detail = await fetchCafe24OrderDetail({
        orderId: orderInfo.orderId,
        mallId: resolvedMallId
      });
      const detailInfo = extractCafe24OrderInfo(detail, resolvedMallId);
      orderInfo = {
        ...orderInfo,
        ...Object.fromEntries(Object.entries(detailInfo).filter(([, value]) => value !== null && value !== undefined))
      };
      payloadJson = appendCafe24WebhookDebugInfo(payloadJson, buildWebhookDebug({
        orderInfo,
        resolvedMallId,
        status: "SUCCESS",
        message: "Cafe24 order detail fetched."
      }));
      console.info("[api/cafe24/webhooks/orders] order detail lookup succeeded", {
        mallId: resolvedMallId,
        orderId: orderInfo.orderId,
        eventType: orderInfo.eventType ?? orderInfo.eventId ?? null,
        tokenLookupMallId: resolvedMallId
      });

      await prisma.cafe24WebhookEvent.update({
        where: { id: eventId },
        data: {
          orderId: orderInfo.orderId ?? null,
          orderNo: orderInfo.orderNo ?? null,
          uploadCode: orderInfo.uploadCode ?? null,
          payloadJson
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cafe24 order detail request failed.";
      payloadJson = appendCafe24WebhookDebugInfo(payloadJson, buildWebhookDebug({
        orderInfo,
        resolvedMallId,
        status: "FAILED",
        message
      }));
      console.warn("[api/cafe24/webhooks/orders] order detail lookup failed", {
        mallId: resolvedMallId,
        orderId: orderInfo.orderId,
        eventType: orderInfo.eventType ?? orderInfo.eventId ?? null,
        tokenLookupMallId: resolvedMallId
      });
      await prisma.cafe24WebhookEvent.update({
        where: { id: eventId },
        data: {
          status: "ORDER_DETAIL_SYNC_FAILED",
          errorMessage: message,
          payloadJson,
          processedAt: new Date()
        }
      });
      return json("ORDER_DETAIL_SYNC_FAILED");
    }
  } else {
    const detailStatus: Cafe24OrderDetailLookupStatus = orderInfo.uploadCode
      ? "NOT_ATTEMPTED_UPLOAD_CODE_PRESENT"
      : orderInfo.orderId
        ? "NOT_ATTEMPTED_CONFIG_MISSING"
        : "NOT_ATTEMPTED_NO_ORDER_ID";
    const detailMessage = orderInfo.uploadCode
      ? "Order detail lookup was not needed because the payload already included an upload code."
      : orderInfo.orderId
        ? `Cafe24 order detail lookup was not attempted because configuration is missing: ${configStatus.missing.join(", ")}.`
        : "Cafe24 order detail lookup was not attempted because the payload did not include order_id.";
    payloadJson = appendCafe24WebhookDebugInfo(payloadJson, buildWebhookDebug({
      orderInfo,
      resolvedMallId,
      status: detailStatus,
      message: detailMessage
    }));
    await prisma.cafe24WebhookEvent.update({
      where: { id: eventId },
      data: { payloadJson }
    });
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
