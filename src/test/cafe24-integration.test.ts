import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  buildCafe24OAuthAuthorizeUrl,
  createCafe24OAuthState,
  extractCafe24OrderInfo,
  getCafe24WebhookAuthFailureReason,
  getCafe24ConfigStatus,
  inspectCafe24WebhookAuthHeaders,
  redactSensitivePayload,
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
        order_memo: "파일 접수번호 PP-UP-20260626-001 입니다."
      }
    }, "peerl");

    expect(info.mallId).toBe("peerl");
    expect(info.orderId).toBe("20260626-0001");
    expect(info.orderNo).toBe("20260626-0001");
    expect(info.memberId).toBe("member-1");
    expect(info.uploadCode).toBe("PP-UP-20260626-001");
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
