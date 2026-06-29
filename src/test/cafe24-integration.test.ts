import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  appendCafe24WebhookDebugInfo,
  buildCafe24OAuthAuthorizeUrl,
  createCafe24OAuthState,
  extractCafe24OrderInfo,
  extractCafe24OrderSummary,
  getCafe24TokenTimingStatus,
  getCafe24WebhookAuthFailureReason,
  getCafe24ConfigStatus,
  getCafe24WebhookDebugInfo,
  inspectCafe24WebhookAuthHeaders,
  isCafe24TestWebhookPayload,
  redactSensitivePayload,
  shouldRefreshCafe24Token,
  verifyCafe24OAuthState,
  verifyCafe24WebhookRequest
} from "@/lib/cafe24";
import { buildUploadCode, extractUploadCodeFromText } from "@/lib/upload-code";

const cafe24Env = {
  CAFE24_MALL_ID: "peerl",
  CAFE24_CLIENT_ID: "client-id",
  CAFE24_CLIENT_SECRET: "client-secret",
  CAFE24_REDIRECT_URI: "https://perpackage-marketing-leads.vercel.app/api/cafe24/oauth/callback",
  CAFE24_WEBHOOK_SECRET: "webhook-secret",
  ADMIN_PASSWORD: "admin-password"
};

describe("Cafe24 upload-code integration helpers", () => {
  it("builds and extracts upload receipt codes", () => {
    const code = buildUploadCode(7, new Date("2026-06-26T03:00:00.000Z"));

    expect(code).toMatch(/^PP-UP-\d{8}-007$/);
    expect(extractUploadCodeFromText(`memo ${code} end`)).toBe(code);
    expect(extractUploadCodeFromText("no upload code")).toBeNull();
  });

  it("extracts Cafe24 order fields and upload code from nested payloads", () => {
    const info = extractCafe24OrderInfo({
      event_type: "order.created",
      resource: {
        order_id: "20260626-0001",
        order_no: "20260626-0001",
        member_id: "member-1",
        order_memo: "upload receipt PP-UP-20260626-001"
      }
    }, "peerl");

    expect(info.mallId).toBe("peerl");
    expect(info.orderId).toBe("20260626-0001");
    expect(info.orderNo).toBe("20260626-0001");
    expect(info.memberId).toBe("member-1");
    expect(info.uploadCode).toBe("PP-UP-20260626-001");
  });

  it("uses the configured mallId fallback and detects Cafe24 test webhook payloads", () => {
    const payload = {
      event_no: 90157,
      resource: {
        client_id: "sample7eBNEqSfkd7I8hoA",
        order_id: "Tb1dbe01667974041111",
        app_name: "app_name"
      }
    };
    const info = extractCafe24OrderInfo(payload, "peerl");

    expect(info.mallId).toBe("peerl");
    expect(info.eventId).toBe("90157");
    expect(info.orderId).toBe("Tb1dbe01667974041111");
    expect(info.orderNo).toBe("Tb1dbe01667974041111");
    expect(isCafe24TestWebhookPayload(payload)).toBe(true);
    expect(isCafe24TestWebhookPayload({ resource: { client_id: "real-client", order_id: "20260627-0001" } })).toBe(false);
  });

  it("skips Cafe24 90023 and 90025 sample webhook payloads from cafe24bestshop", () => {
    const samplePayload = {
      event_no: 90023,
      resource: {
        mall_id: "cafe24bestshop",
        order_id: "20200717-0029236"
      }
    };

    expect(isCafe24TestWebhookPayload(samplePayload)).toBe(true);
    expect(isCafe24TestWebhookPayload({
      event_no: 90025,
      resource: {
        mall_id: "cafe24bestshop",
        order_no: "20200717-0029236"
      }
    })).toBe(true);
    expect(isCafe24TestWebhookPayload({
      event_no: 90023,
      resource: {
        mall_id: "peerl",
        order_id: "20260627-0000032"
      }
    })).toBe(false);
  });

  it("extracts a safe Cafe24 manual order lookup summary", () => {
    const summary = extractCafe24OrderSummary({
      order: {
        order_id: "20260627-0000032",
        order_no: "20260627-0000032",
        buyer_name: "Test buyer",
        buyer_cellphone: "010-1234-5678",
        ordered_date: "2026-06-27 10:00:00",
        payment_status: "paid",
        shipping_status: "F",
        total_paid_amount: "12000",
        items: [
          {
            product_name_en: "Design service",
            product_no: 1001,
            variant_code: "P0000AAA000A",
            option_value: "matte"
          },
          { product_name_default: "Y box" }
        ],
        order_memo: "upload receipt PP-UP-20260627-001"
      }
    }, "peerl", {
      projectId: "project-1",
      uploadCode: "PP-UP-20260627-001",
      companyName: "Peerpackage",
      customerName: "Test buyer",
      matchType: "upload_code"
    });

    expect(summary.orderId).toBe("20260627-0000032");
    expect(summary.orderNo).toBe("20260627-0000032");
    expect(summary.buyerName).toBe("Test buyer");
    expect(summary.buyerPhone).toBe("010-1234-5678");
    expect(summary.productName).toBe("Design service, Y box");
    expect(summary.productIdentifiers).toEqual(["1001", "P0000AAA000A", "matte"]);
    expect(summary.paymentStatus).toBe("paid");
    expect(summary.paymentStatusSource).toBe("paid");
    expect(summary.shippingStatusSource).toBe("F");
    expect(summary.shippingStatus).toBe("F / 배송전");
    expect(summary.totalPaidAmount).toBe("12000");
    expect(summary.uploadCode).toBe("PP-UP-20260627-001");
    expect(summary.matchedProject?.matchType).toBe("upload_code");
    expect(summary.responseShape.topLevelKeys).toEqual(["order"]);
    expect(summary.responseShape.hasOrderObject).toBe(true);
    expect(summary.responseShape.hasItems).toBe(true);
    expect(summary.responseShape.hasProducts).toBe(false);
    expect(summary.responseShape.hasOrderItems).toBe(false);
    expect(summary.responseShape.firstItemKeys).toEqual(["option_value", "product_name_en", "product_no", "variant_code"]);
    expect(summary.responseShape.paymentKeys).toContain("payment_status");
    expect(summary.responseShape.shippingKeys).toContain("shipping_status");
    expect(summary.responseShape.memoKeys).toContain("order_memo");
  });

  it("stores and reads safe webhook debug information without exposing secrets", () => {
    const payloadJson = appendCafe24WebhookDebugInfo(redactSensitivePayload({
      access_token: "access",
      refresh_token: "refresh",
      resource: {
        mall_id: "peerl",
        order_id: "20260627-0001"
      }
    }), {
      mallId: "peerl",
      orderId: "20260627-0001",
      eventType: "order.paid",
      tokenLookupMallId: "peerl",
      orderDetailLookupStatus: "SUCCESS",
      orderDetailLookupMessage: "Cafe24 order detail fetched.",
      orderDetailLookupAt: "2026-06-27T01:00:00.000Z"
    });
    const debug = getCafe24WebhookDebugInfo({
      payloadJson,
      status: "LINKED",
      mallId: null,
      orderId: null,
      eventType: null,
      errorMessage: null
    }, "fallback");
    const serialized = JSON.stringify(payloadJson);

    expect(debug.mallId).toBe("peerl");
    expect(debug.orderId).toBe("20260627-0001");
    expect(debug.eventType).toBe("order.paid");
    expect(debug.tokenLookupMallId).toBe("peerl");
    expect(debug.orderDetailLookupStatus).toBe("SUCCESS");
    expect(serialized).toContain("[REDACTED]");
    expect(serialized).not.toContain('"access"');
    expect(serialized).not.toContain('"refresh"');
  });

  it("creates and verifies signed OAuth state values", () => {
    const now = Date.UTC(2026, 5, 26, 4, 0, 0);
    const state = createCafe24OAuthState({ now, nonce: "nonce", env: cafe24Env });

    expect(verifyCafe24OAuthState({ state, expectedState: state, now: now + 1000, env: cafe24Env })).toBe(true);
    expect(verifyCafe24OAuthState({ state, expectedState: state.replace("nonce", "other"), now: now + 1000, env: cafe24Env })).toBe(false);
  });

  it("builds the Cafe24 OAuth authorization URL without exposing secret values", () => {
    const url = new URL(buildCafe24OAuthAuthorizeUrl({ state: "state-value", env: cafe24Env }));

    expect(url.origin).toBe("https://peerl.cafe24api.com");
    expect(url.searchParams.get("client_id")).toBe("client-id");
    expect(url.searchParams.get("redirect_uri")).toBe(cafe24Env.CAFE24_REDIRECT_URI);
    expect(url.searchParams.get("state")).toBe("state-value");
    expect(url.toString()).not.toContain("client-secret");
  });

  it("decides when Cafe24 access tokens should be refreshed", () => {
    const now = Date.UTC(2026, 5, 29, 0, 0, 0);

    expect(getCafe24TokenTimingStatus({
      expiresAt: new Date(now + 60 * 60 * 1000),
      now
    })).toBe("valid");
    expect(shouldRefreshCafe24Token({
      expiresAt: new Date(now + 60 * 60 * 1000),
      now
    })).toBe(false);
    expect(getCafe24TokenTimingStatus({
      expiresAt: new Date(now + 5 * 60 * 1000),
      now
    })).toBe("refresh_needed");
    expect(shouldRefreshCafe24Token({
      expiresAt: new Date(now + 5 * 60 * 1000),
      now
    })).toBe(true);
    expect(getCafe24TokenTimingStatus({
      expiresAt: new Date(now - 1000),
      now
    })).toBe("expired");
    expect(shouldRefreshCafe24Token({
      expiresAt: new Date(now - 1000),
      now
    })).toBe(true);
  });

  it("verifies direct-token and hmac webhook signatures", () => {
    const rawBody = JSON.stringify({ order_id: "20260626-0001" });
    const hmac = crypto.createHmac("sha256", cafe24Env.CAFE24_WEBHOOK_SECRET).update(rawBody).digest("hex");

    expect(verifyCafe24WebhookRequest({
      rawBody,
      headers: new Headers({ "x-cafe24-webhook-secret": cafe24Env.CAFE24_WEBHOOK_SECRET }),
      env: cafe24Env
    })).toBe(true);
    expect(verifyCafe24WebhookRequest({
      rawBody,
      headers: new Headers({ "x-cafe24-webhook-key": cafe24Env.CAFE24_WEBHOOK_SECRET }),
      env: cafe24Env
    })).toBe(true);
    expect(verifyCafe24WebhookRequest({
      rawBody,
      headers: new Headers({ "x-api-key": cafe24Env.CAFE24_WEBHOOK_SECRET }),
      env: cafe24Env
    })).toBe(true);
    expect(verifyCafe24WebhookRequest({
      rawBody,
      headers: new Headers({ "x-cafe24-hmac-sha256": hmac }),
      env: cafe24Env
    })).toBe(true);
    expect(verifyCafe24WebhookRequest({
      rawBody,
      headers: new Headers({ "x-webhook-signature": hmac }),
      env: cafe24Env
    })).toBe(true);
    expect(verifyCafe24WebhookRequest({
      rawBody,
      headers: new Headers({ "x-cafe24-webhook-secret": "wrong" }),
      env: cafe24Env
    })).toBe(false);
  });

  it("reports webhook auth failure reasons without exposing values", () => {
    const headers = new Headers({
      "x-cafe24-event-type": "sample",
      "x-cafe24-webhook-secret": "wrong"
    });
    const inspection = inspectCafe24WebhookAuthHeaders(headers);

    expect(inspection.directTokenHeaderNames).toEqual(["x-cafe24-webhook-secret"]);
    expect(inspection.unsupportedCafe24HeaderNames).toEqual(["x-cafe24-event-type"]);
    expect(JSON.stringify(inspection)).not.toContain("wrong");
    expect(getCafe24WebhookAuthFailureReason({ headers, env: cafe24Env })).toBe("auth_mismatch");
    expect(getCafe24WebhookAuthFailureReason({ headers: new Headers(), env: cafe24Env })).toBe("auth_header_missing_or_unsupported");
    expect(getCafe24WebhookAuthFailureReason({ headers, env: { ...cafe24Env, CAFE24_WEBHOOK_SECRET: "" } })).toBe("secret_missing");
  });

  it("reports x-api-key as a direct token webhook auth header without exposing values", () => {
    const headers = new Headers({ "x-api-key": "wrong" });
    const inspection = inspectCafe24WebhookAuthHeaders(headers);

    expect(inspection.directTokenHeaderNames).toEqual(["x-api-key"]);
    expect(inspection.signatureHeaderNames).toEqual([]);
    expect(inspection.unsupportedCafe24HeaderNames).toEqual([]);
    expect(inspection.receivedHeaderNames).toContain("x-api-key");
    expect(JSON.stringify(inspection)).not.toContain("wrong");
    expect(getCafe24WebhookAuthFailureReason({ headers, env: cafe24Env })).toBe("auth_mismatch");
  });

  it("redacts sensitive payload fields before storage", () => {
    const redacted = redactSensitivePayload({
      access_token: "access",
      nested: {
        refreshToken: "refresh",
        orderMemo: "PP-UP-20260626-001"
      }
    });
    const serialized = JSON.stringify(redacted);

    expect(serialized).toContain("[REDACTED]");
    expect(serialized).toContain("PP-UP-20260626-001");
    expect(serialized).not.toContain('"access"');
    expect(serialized).not.toContain('"refresh"');
  });

  it("reports missing Cafe24 environment keys by name only", () => {
    const status = getCafe24ConfigStatus({
      CAFE24_MALL_ID: "peerl"
    });

    expect(status.missing).toContain("CAFE24_CLIENT_ID");
    expect(JSON.stringify(status)).not.toContain("client-secret");
  });
});
