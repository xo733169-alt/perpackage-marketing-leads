import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractUploadCodeFromText, normalizeUploadCode } from "@/lib/upload-code";

export const CAFE24_OAUTH_STATE_COOKIE = "perpackage_cafe24_oauth_state";
export const CAFE24_LINKED_STATUS = "LINKED_TO_ORDER";
export const CAFE24_LINK_SOURCE_WEBHOOK = "CAFE24_WEBHOOK";
export const CAFE24_LINK_SOURCE_API = "CAFE24_API";
export const CAFE24_LINK_SOURCE_MANUAL = "MANUAL";

const DEFAULT_CAFE24_API_VERSION = "2024-06-01";
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
const TOKEN_REFRESH_MARGIN_MS = 3 * 60 * 1000;
const DEFAULT_SCOPES = [
  "mall.read_application",
  "mall.write_application",
  "mall.read_order",
  "mall.read_customer",
  "mall.read_product",
  "mall.read_shipping",
  "mall.read_customer_identifier"
];

type Cafe24Env = Pick<
  NodeJS.ProcessEnv,
  | "CAFE24_MALL_ID"
  | "CAFE24_CLIENT_ID"
  | "CAFE24_CLIENT_SECRET"
  | "CAFE24_REDIRECT_URI"
  | "CAFE24_WEBHOOK_SECRET"
  | "CAFE24_API_VERSION"
  | "CAFE24_SCOPES"
  | "ADMIN_PASSWORD"
>;

export type Cafe24Config = {
  mallId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  webhookSecret: string;
  apiVersion: string;
  scopes: string[];
};

export type Cafe24ConfigStatus = {
  missing: string[];
  hasMallId: boolean;
  hasClientId: boolean;
  hasClientSecret: boolean;
  hasRedirectUri: boolean;
  hasWebhookSecret: boolean;
  apiVersion: string;
  scopes: string[];
};

export type Cafe24OrderInfo = {
  eventType?: string | null;
  eventId?: string | null;
  mallId?: string | null;
  orderId?: string | null;
  orderNo?: string | null;
  memberId?: string | null;
  orderMemo?: string | null;
  uploadCode?: string | null;
};

export type LinkCafe24OrderInput = {
  uploadCode?: string | null;
  mallId?: string | null;
  orderId?: string | null;
  orderNo?: string | null;
  memberId?: string | null;
  orderMemo?: string | null;
  source: string;
  webhookEventId?: string | null;
};

export type LinkCafe24OrderResult = {
  status: "LINKED" | "SKIPPED" | "FAILED";
  message: string;
  projectId?: string;
};

type Cafe24TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number | string;
  scope?: string | string[];
  scopes?: string | string[];
};

function readEnv(env: Cafe24Env | Record<string, string | undefined> = process.env) {
  return {
    mallId: env.CAFE24_MALL_ID?.trim() ?? "",
    clientId: env.CAFE24_CLIENT_ID?.trim() ?? "",
    clientSecret: env.CAFE24_CLIENT_SECRET?.trim() ?? "",
    redirectUri: env.CAFE24_REDIRECT_URI?.trim() ?? "",
    webhookSecret: env.CAFE24_WEBHOOK_SECRET?.trim() ?? "",
    apiVersion: env.CAFE24_API_VERSION?.trim() || DEFAULT_CAFE24_API_VERSION,
    scopes: (env.CAFE24_SCOPES?.trim() ? env.CAFE24_SCOPES : DEFAULT_SCOPES.join(","))
      .split(/[,\s]+/)
      .map((scope) => scope.trim())
      .filter(Boolean),
    adminPassword: env.ADMIN_PASSWORD?.trim() ?? ""
  };
}

export function getCafe24ConfigStatus(env: Cafe24Env | Record<string, string | undefined> = process.env): Cafe24ConfigStatus {
  const config = readEnv(env);
  const missing: string[] = [];

  if (!config.mallId) missing.push("CAFE24_MALL_ID");
  if (!config.clientId) missing.push("CAFE24_CLIENT_ID");
  if (!config.clientSecret) missing.push("CAFE24_CLIENT_SECRET");
  if (!config.redirectUri) missing.push("CAFE24_REDIRECT_URI");
  if (!config.webhookSecret) missing.push("CAFE24_WEBHOOK_SECRET");

  return {
    missing,
    hasMallId: Boolean(config.mallId),
    hasClientId: Boolean(config.clientId),
    hasClientSecret: Boolean(config.clientSecret),
    hasRedirectUri: Boolean(config.redirectUri),
    hasWebhookSecret: Boolean(config.webhookSecret),
    apiVersion: config.apiVersion,
    scopes: config.scopes
  };
}

export function requireCafe24Config(env: Cafe24Env | Record<string, string | undefined> = process.env): Cafe24Config {
  const config = readEnv(env);
  const status = getCafe24ConfigStatus(env);

  if (status.missing.length) {
    throw new Error(`Missing Cafe24 configuration: ${status.missing.join(", ")}`);
  }

  return {
    mallId: config.mallId,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    redirectUri: config.redirectUri,
    webhookSecret: config.webhookSecret,
    apiVersion: config.apiVersion,
    scopes: config.scopes
  };
}

export function getCafe24ApiBaseUrl(mallId: string): string {
  return `https://${mallId}.cafe24api.com`;
}

export function buildCafe24OAuthAuthorizeUrl({
  state,
  env = process.env
}: {
  state: string;
  env?: Cafe24Env | Record<string, string | undefined>;
}): string {
  const config = requireCafe24Config(env);
  const url = new URL(`${getCafe24ApiBaseUrl(config.mallId)}/api/v2/oauth/authorize`);

  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("state", state);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scopes.join(","));

  return url.toString();
}

function getStateSecret(env: Cafe24Env | Record<string, string | undefined> = process.env): string {
  const config = readEnv(env);
  return config.adminPassword || config.clientSecret || "perpackage-cafe24-dev-state";
}

function signStatePayload(payload: string, env: Cafe24Env | Record<string, string | undefined> = process.env): string {
  return crypto.createHmac("sha256", getStateSecret(env)).update(payload).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCafe24OAuthState({
  now = Date.now(),
  nonce = crypto.randomBytes(16).toString("hex"),
  env = process.env
}: {
  now?: number;
  nonce?: string;
  env?: Cafe24Env | Record<string, string | undefined>;
} = {}): string {
  const payload = `${now}.${nonce}`;
  return `${payload}.${signStatePayload(payload, env)}`;
}

export function verifyCafe24OAuthState({
  state,
  expectedState,
  now = Date.now(),
  env = process.env
}: {
  state: string | null | undefined;
  expectedState: string | null | undefined;
  now?: number;
  env?: Cafe24Env | Record<string, string | undefined>;
}): boolean {
  if (!state || !expectedState || state !== expectedState) return false;

  const [issuedAt, nonce, signature] = state.split(".");
  if (!issuedAt || !nonce || !signature) return false;

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return false;

  const ageSeconds = (now - issuedAtMs) / 1000;
  if (ageSeconds < 0 || ageSeconds > OAUTH_STATE_MAX_AGE_SECONDS) return false;

  return safeEqual(signature, signStatePayload(`${issuedAt}.${nonce}`, env));
}

function getHeader(headers: Headers, names: string[]): string | null {
  for (const name of names) {
    const value = headers.get(name);
    if (value?.trim()) return value.trim();
  }
  return null;
}

function normalizeBearerValue(value: string): string {
  return value.replace(/^bearer\s+/i, "").trim();
}

const CAFE24_WEBHOOK_DIRECT_TOKEN_HEADERS = [
  "x-cafe24-webhook-secret",
  "x-cafe24-webhook-auth",
  "x-cafe24-webhook-token",
  "x-cafe24-webhook-key",
  "x-cafe24-webhook-authentication",
  "x-cafe24-auth",
  "x-cafe24-authentication",
  "x-cafe24-token",
  "x-cafe24-secret",
  "x-api-key",
  "x-webhook-secret",
  "x-webhook-token",
  "authorization"
] as const;

const CAFE24_WEBHOOK_SIGNATURE_HEADERS = [
  "x-cafe24-hmac-sha256",
  "x-cafe24-hmac",
  "x-cafe24-signature",
  "x-cafe24-webhook-signature",
  "x-cafe24-webhook-hmac",
  "x-cafe24-webhook-hmac-sha256",
  "x-cafe24-sha256",
  "x-hub-signature-256",
  "x-webhook-signature",
  "x-signature"
] as const;

const CAFE24_WEBHOOK_AUTH_HEADERS = new Set<string>([
  ...CAFE24_WEBHOOK_DIRECT_TOKEN_HEADERS,
  ...CAFE24_WEBHOOK_SIGNATURE_HEADERS
]);

function verifyHmacSignature(rawBody: string, secret: string, signature: string): boolean {
  const normalized = signature.replace(/^sha256=/i, "").trim();
  const hexDigest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const base64Digest = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  return safeEqual(normalized, hexDigest) || safeEqual(normalized, base64Digest);
}

export function inspectCafe24WebhookAuthHeaders(headers: Headers) {
  const receivedHeaderNames = Array.from(headers.keys()).map((header) => header.toLowerCase()).sort();
  const directTokenHeaderNames = CAFE24_WEBHOOK_DIRECT_TOKEN_HEADERS.filter((header) => Boolean(headers.get(header)));
  const signatureHeaderNames = CAFE24_WEBHOOK_SIGNATURE_HEADERS.filter((header) => Boolean(headers.get(header)));
  const unsupportedCafe24HeaderNames = receivedHeaderNames.filter(
    (header) => header.startsWith("x-cafe24") && !CAFE24_WEBHOOK_AUTH_HEADERS.has(header)
  );

  return {
    receivedHeaderNames,
    directTokenHeaderNames,
    signatureHeaderNames,
    unsupportedCafe24HeaderNames
  };
}

export function getCafe24WebhookAuthFailureReason({
  headers,
  env = process.env
}: {
  headers: Headers;
  env?: Cafe24Env | Record<string, string | undefined>;
}): "secret_missing" | "auth_header_missing_or_unsupported" | "auth_mismatch" {
  const secret = readEnv(env).webhookSecret;
  if (!secret) return "secret_missing";

  const inspection = inspectCafe24WebhookAuthHeaders(headers);
  if (!inspection.directTokenHeaderNames.length && !inspection.signatureHeaderNames.length) {
    return "auth_header_missing_or_unsupported";
  }

  return "auth_mismatch";
}

export function verifyCafe24WebhookRequest({
  rawBody,
  headers,
  env = process.env
}: {
  rawBody: string;
  headers: Headers;
  env?: Cafe24Env | Record<string, string | undefined>;
}): boolean {
  const secret = readEnv(env).webhookSecret;
  if (!secret) return false;

  const directToken = getHeader(headers, [...CAFE24_WEBHOOK_DIRECT_TOKEN_HEADERS]);

  if (directToken && safeEqual(normalizeBearerValue(directToken), secret)) {
    return true;
  }

  const signature = getHeader(headers, [...CAFE24_WEBHOOK_SIGNATURE_HEADERS]);

  return signature ? verifyHmacSignature(rawBody, secret, signature) : false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeKey(key: string): string {
  return key.replace(/[-_]/g, "").toLowerCase();
}

function findStringByKeys(value: unknown, candidateKeys: string[], depth = 0): string | null {
  if (depth > 8 || value === null || value === undefined) return null;
  const normalizedCandidates = new Set(candidateKeys.map(normalizeKey));

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (normalizedCandidates.has(normalizeKey(key)) && typeof item === "string" && item.trim()) {
        return item.trim();
      }
    }

    for (const item of Object.values(value)) {
      const found = findStringByKeys(item, candidateKeys, depth + 1);
      if (found) return found;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringByKeys(item, candidateKeys, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

function findUploadCodeInUnknown(value: unknown, depth = 0): string | null {
  if (depth > 8 || value === null || value === undefined) return null;

  if (typeof value === "string") {
    return extractUploadCodeFromText(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUploadCodeInUnknown(item, depth + 1);
      if (found) return found;
    }
  }

  if (isRecord(value)) {
    for (const item of Object.values(value)) {
      const found = findUploadCodeInUnknown(item, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

export function extractCafe24OrderInfo(payload: unknown, fallbackMallId?: string | null): Cafe24OrderInfo {
  const orderMemo = findStringByKeys(payload, [
    "order_memo",
    "orderMemo",
    "memo",
    "customer_memo",
    "customerMemo",
    "client_memo",
    "clientMemo",
    "additional_info",
    "additionalInfo"
  ]);

  return {
    eventType: findStringByKeys(payload, ["event_type", "eventType", "event", "resource_type", "resourceType"]),
    eventId: findStringByKeys(payload, ["event_id", "eventId", "webhook_id", "webhookId", "id"]),
    mallId: findStringByKeys(payload, ["mall_id", "mallId", "mall"]) ?? fallbackMallId ?? null,
    orderId: findStringByKeys(payload, ["order_id", "orderId", "order_code", "orderCode"]),
    orderNo: findStringByKeys(payload, ["order_no", "orderNo", "order_number", "orderNumber", "order_id", "orderId"]),
    memberId: findStringByKeys(payload, ["member_id", "memberId", "customer_id", "customerId"]),
    orderMemo,
    uploadCode: findUploadCodeInUnknown(payload) ?? extractUploadCodeFromText(orderMemo)
  };
}

function isSensitiveKey(key: string): boolean {
  return /token|secret|password|authorization|access[_-]?token|refresh[_-]?token|client[_-]?secret/i.test(key);
}

export function redactSensitivePayload(value: unknown, depth = 0): Prisma.InputJsonValue {
  if (depth > 12) return "[TRUNCATED]";
  if (value === null || value === undefined) return "[NULL]";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitivePayload(item, depth + 1));
  }

  if (isRecord(value)) {
    const redacted: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, item] of Object.entries(value)) {
      redacted[key] = isSensitiveKey(key) ? "[REDACTED]" : redactSensitivePayload(item, depth + 1);
    }
    return redacted;
  }

  return String(value);
}

function normalizeScopes(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value.filter(Boolean).join(",");
  return value?.trim() || null;
}

function parseTokenResponse(data: Cafe24TokenResponse) {
  if (!data.access_token || !data.refresh_token) {
    throw new Error("Cafe24 token response did not include required token fields.");
  }

  const expiresInSeconds = Number(data.expires_in ?? 7200);
  const expiresAt = new Date(Date.now() + (Number.isFinite(expiresInSeconds) ? expiresInSeconds : 7200) * 1000);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt,
    scopes: normalizeScopes(data.scope ?? data.scopes)
  };
}

async function requestCafe24Token(params: URLSearchParams, env: Cafe24Env | Record<string, string | undefined> = process.env) {
  const config = requireCafe24Config(env);
  const response = await fetch(`${getCafe24ApiBaseUrl(config.mallId)}/api/v2/oauth/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params
  });

  if (!response.ok) {
    throw new Error(`Cafe24 token request failed with status ${response.status}.`);
  }

  const json = (await response.json()) as Cafe24TokenResponse;
  return parseTokenResponse(json);
}

export async function exchangeCafe24CodeForToken({
  code,
  env = process.env
}: {
  code: string;
  env?: Cafe24Env | Record<string, string | undefined>;
}) {
  const config = requireCafe24Config(env);
  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri
  });
  const token = await requestCafe24Token(params, env);

  return prisma.cafe24Token.upsert({
    where: { mallId: config.mallId },
    create: {
      mallId: config.mallId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
      scopes: token.scopes
    },
    update: {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
      scopes: token.scopes
    }
  });
}

export async function refreshCafe24Token({
  mallId,
  env = process.env
}: {
  mallId: string;
  env?: Cafe24Env | Record<string, string | undefined>;
}) {
  const existing = await prisma.cafe24Token.findUnique({ where: { mallId } });
  if (!existing) {
    throw new Error("Cafe24 token is not connected.");
  }

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: existing.refreshToken
  });
  const token = await requestCafe24Token(params, env);

  return prisma.cafe24Token.update({
    where: { mallId },
    data: {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
      scopes: token.scopes ?? existing.scopes
    }
  });
}

export async function getValidCafe24Token({
  mallId,
  env = process.env
}: {
  mallId: string;
  env?: Cafe24Env | Record<string, string | undefined>;
}) {
  const token = await prisma.cafe24Token.findUnique({ where: { mallId } });
  if (!token) {
    throw new Error("Cafe24 token is not connected.");
  }

  if (token.expiresAt.getTime() - Date.now() <= TOKEN_REFRESH_MARGIN_MS) {
    return refreshCafe24Token({ mallId, env });
  }

  return token;
}

export async function fetchCafe24OrderDetail({
  orderId,
  mallId,
  env = process.env
}: {
  orderId: string;
  mallId?: string | null;
  env?: Cafe24Env | Record<string, string | undefined>;
}) {
  const config = requireCafe24Config(env);
  const resolvedMallId = mallId?.trim() || config.mallId;
  const token = await getValidCafe24Token({ mallId: resolvedMallId, env });
  const endpoint = `${getCafe24ApiBaseUrl(resolvedMallId)}/api/v2/admin/orders/${encodeURIComponent(orderId)}`;
  const requestHeaders = {
    Authorization: `Bearer ${token.accessToken}`,
    "Content-Type": "application/json",
    "X-Cafe24-Api-Version": config.apiVersion
  };
  let response = await fetch(endpoint, { headers: requestHeaders });

  if (response.status === 401) {
    const refreshed = await refreshCafe24Token({ mallId: resolvedMallId, env });
    response = await fetch(endpoint, {
      headers: {
        ...requestHeaders,
        Authorization: `Bearer ${refreshed.accessToken}`
      }
    });
  }

  if (!response.ok) {
    throw new Error(`Cafe24 order request failed with status ${response.status}.`);
  }

  return response.json() as Promise<unknown>;
}

function hasDifferentLinkedOrder(
  project: { cafe24OrderId: string | null; cafe24OrderNo: string | null },
  input: LinkCafe24OrderInput
): boolean {
  if (project.cafe24OrderId && input.orderId && project.cafe24OrderId !== input.orderId) return true;
  if (project.cafe24OrderNo && input.orderNo && project.cafe24OrderNo !== input.orderNo) return true;
  return false;
}

async function updateWebhookEventStatus({
  webhookEventId,
  status,
  message,
  projectId
}: {
  webhookEventId?: string | null;
  status: string;
  message?: string | null;
  projectId?: string | null;
}) {
  if (!webhookEventId) return;

  await prisma.cafe24WebhookEvent.update({
    where: { id: webhookEventId },
    data: {
      status,
      errorMessage: message ?? null,
      uploadProjectId: projectId ?? null,
      processedAt: new Date()
    }
  });
}

export async function linkCafe24OrderToUploadProject(input: LinkCafe24OrderInput): Promise<LinkCafe24OrderResult> {
  const uploadCode = input.uploadCode ? normalizeUploadCode(input.uploadCode) : null;

  if (!uploadCode) {
    const message = "Webhook/order payload did not include an upload code.";
    await updateWebhookEventStatus({ webhookEventId: input.webhookEventId, status: "SKIPPED", message });
    return { status: "SKIPPED", message };
  }

  const project = await prisma.uploadProject.findUnique({
    where: { uploadCode },
    select: {
      id: true,
      cafe24OrderId: true,
      cafe24OrderNo: true,
      linkedAt: true
    }
  });

  if (!project) {
    const message = `Upload project was not found for ${uploadCode}.`;
    await updateWebhookEventStatus({ webhookEventId: input.webhookEventId, status: "SKIPPED", message });
    return { status: "SKIPPED", message };
  }

  if (hasDifferentLinkedOrder(project, input)) {
    const message = "Upload project is already linked to a different Cafe24 order.";
    await updateWebhookEventStatus({ webhookEventId: input.webhookEventId, status: "FAILED", message, projectId: project.id });
    return { status: "FAILED", message, projectId: project.id };
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.uploadProject.update({
      where: { id: project.id },
      data: {
        cafe24MallId: input.mallId?.trim() || null,
        cafe24OrderId: input.orderId?.trim() || null,
        cafe24OrderNo: input.orderNo?.trim() || input.orderId?.trim() || null,
        cafe24MemberId: input.memberId?.trim() || null,
        cafe24OrderMemo: input.orderMemo?.trim() || null,
        linkedAt: project.linkedAt ?? now,
        linkSource: input.source,
        orderSyncedAt: now,
        status: CAFE24_LINKED_STATUS
      }
    });

    if (!project.linkedAt) {
      await tx.fileReviewLog.create({
        data: {
          projectId: project.id,
          status: CAFE24_LINKED_STATUS,
          message: "Cafe24 주문과 자동 연결되었습니다.",
          createdBy: "SYSTEM",
          createdAt: now
        }
      });
    }

    if (input.webhookEventId) {
      await tx.cafe24WebhookEvent.update({
        where: { id: input.webhookEventId },
        data: {
          status: "LINKED",
          uploadProjectId: project.id,
          processedAt: now,
          errorMessage: null
        }
      });
    }
  });

  return {
    status: "LINKED",
    message: project.linkedAt ? "Upload project was already linked to this Cafe24 order." : "Upload project was linked to Cafe24 order.",
    projectId: project.id
  };
}
