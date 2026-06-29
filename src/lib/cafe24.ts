import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { extractUploadCodeFromText, normalizeUploadCode } from "@/lib/upload-code";

export const CAFE24_OAUTH_STATE_COOKIE = "perpackage_cafe24_oauth_state";
export const CAFE24_LINKED_STATUS = "LINKED_TO_ORDER";
export const CAFE24_ORDER_LINK_PENDING_STATUS = "ORDER_LINK_PENDING";
export const CAFE24_LINK_SOURCE_WEBHOOK = "CAFE24_WEBHOOK";
export const CAFE24_LINK_SOURCE_API = "CAFE24_API";
export const CAFE24_LINK_SOURCE_MANUAL = "MANUAL";

const DEFAULT_CAFE24_API_VERSION = "2024-06-01";
const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
export const CAFE24_TOKEN_REFRESH_MARGIN_MS = 10 * 60 * 1000;
const WEBHOOK_DEBUG_KEY = "_perpackage_debug";
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

export type Cafe24OrderSummary = {
  orderId: string | null;
  orderNo: string | null;
  buyerName: string | null;
  buyerPhone: string | null;
  productName: string | null;
  productIdentifiers: string[];
  paymentStatusSource: string | null;
  paymentStatus: string | null;
  orderedAt: string | null;
  shippingStatusSource: string | null;
  shippingStatus: string | null;
  totalPaidAmount: string | null;
  uploadCode: string | null;
  responseShape: Cafe24OrderResponseShape;
  matchedProject: Cafe24OrderProjectMatch | null;
};

export type Cafe24OrderResponseShape = {
  topLevelKeys: string[];
  hasOrderObject: boolean;
  hasOrdersArray: boolean;
  hasItems: boolean;
  hasOrderItems: boolean;
  hasProducts: boolean;
  firstItemKeys: string[];
  paymentKeys: string[];
  shippingKeys: string[];
  memoKeys: string[];
  adminMemoKeys: string[];
  customerMemoKeys: string[];
};

export type Cafe24OrderProjectMatch = {
  projectId: string;
  uploadCode: string | null;
  companyName: string | null;
  customerName: string | null;
  matchType: "upload_code" | "order_id" | "order_no" | "order_number";
};

export type LinkCafe24OrderInput = {
  uploadCode?: string | null;
  mallId?: string | null;
  orderId?: string | null;
  orderNo?: string | null;
  memberId?: string | null;
  orderMemo?: string | null;
  buyerName?: string | null;
  buyerPhone?: string | null;
  productName?: string | null;
  productIdentifiers?: string[];
  orderedAt?: string | null;
  source: string;
  webhookEventId?: string | null;
};

export type Cafe24UploadProjectMatchCandidate = {
  projectId: string;
  uploadCode: string | null;
  companyName: string | null;
  customerName: string;
  contactName: string | null;
  phone: string;
  productName: string;
  createdAt: string;
  score: number;
  reasons: string[];
  action: "AUTO_LINKABLE" | "REVIEW_REQUIRED";
};

export type LinkCafe24OrderResult = {
  status: "LINKED" | "SKIPPED" | "FAILED";
  message: string;
  projectId?: string;
  candidates?: Cafe24UploadProjectMatchCandidate[];
  autoLinkedByCandidate?: boolean;
};

export type Cafe24OrderDetailLookupStatus =
  | "NOT_ATTEMPTED"
  | "SKIPPED_TEST_PAYLOAD"
  | "NOT_ATTEMPTED_UPLOAD_CODE_PRESENT"
  | "NOT_ATTEMPTED_NO_ORDER_ID"
  | "NOT_ATTEMPTED_CONFIG_MISSING"
  | "ATTEMPTING"
  | "SUCCESS"
  | "FAILED";

export type Cafe24WebhookSafeDebugInfo = {
  mallId: string | null;
  orderId: string | null;
  eventType: string | null;
  tokenLookupMallId: string | null;
  orderDetailLookupStatus: Cafe24OrderDetailLookupStatus;
  orderDetailLookupMessage: string | null;
  orderDetailLookupAt: string | null;
};

type Cafe24TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number | string;
  refresh_token_expires_in?: number | string;
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
      if (normalizedCandidates.has(normalizeKey(key)) && typeof item === "number" && Number.isFinite(item)) {
        return String(item);
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

function getStringValuesByKeys(value: unknown, candidateKeys: string[], depth = 0): string[] {
  if (depth > 8 || value === null || value === undefined) return [];
  const normalizedCandidates = new Set(candidateKeys.map(normalizeKey));
  const values: string[] = [];

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (normalizedCandidates.has(normalizeKey(key))) {
        if (typeof item === "string" && item.trim()) values.push(item.trim());
        if (typeof item === "number" && Number.isFinite(item)) values.push(String(item));
        if (typeof item === "boolean") values.push(item ? "true" : "false");
      }
    }

    for (const item of Object.values(value)) {
      values.push(...getStringValuesByKeys(item, candidateKeys, depth + 1));
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      values.push(...getStringValuesByKeys(item, candidateKeys, depth + 1));
    }
  }

  return Array.from(new Set(values));
}

function collectMatchingKeys(value: unknown, candidateKeys: string[], depth = 0): string[] {
  if (depth > 8 || value === null || value === undefined) return [];
  const normalizedCandidates = new Set(candidateKeys.map(normalizeKey));
  const keys: string[] = [];

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (normalizedCandidates.has(normalizeKey(key))) keys.push(key);
      keys.push(...collectMatchingKeys(item, candidateKeys, depth + 1));
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      keys.push(...collectMatchingKeys(item, candidateKeys, depth + 1));
    }
  }

  return Array.from(new Set(keys)).sort();
}

function hasNestedRecordKey(value: unknown, candidateKeys: string[], arrayOnly = false, depth = 0): boolean {
  if (depth > 8 || value === null || value === undefined) return false;
  const normalizedCandidates = new Set(candidateKeys.map(normalizeKey));

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (normalizedCandidates.has(normalizeKey(key))) {
        if (arrayOnly ? Array.isArray(item) : isRecord(item)) return true;
      }
      if (hasNestedRecordKey(item, candidateKeys, arrayOnly, depth + 1)) return true;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (hasNestedRecordKey(item, candidateKeys, arrayOnly, depth + 1)) return true;
    }
  }

  return false;
}

const CAFE24_PRODUCT_NAME_KEYS = [
  "product_name",
  "productName",
  "product_name_default",
  "productNameDefault",
  "item_name",
  "itemName",
  "product_name_en",
  "productNameEn",
  "product_no",
  "productNo",
  "variant_code",
  "variantCode",
  "option_value",
  "optionValue"
];

const CAFE24_PRIMARY_PRODUCT_NAME_KEYS = [
  "product_name",
  "productName",
  "product_name_default",
  "productNameDefault",
  "item_name",
  "itemName",
  "product_name_en",
  "productNameEn"
];

const CAFE24_PRODUCT_FALLBACK_KEYS = [
  "product_no",
  "productNo",
  "variant_code",
  "variantCode",
  "option_value",
  "optionValue"
];

const CAFE24_PAYMENT_KEYS = [
  "payment_status",
  "paymentStatus",
  "payment_state",
  "paymentState",
  "payment_status_text",
  "paymentStatusText",
  "paid",
  "payed",
  "payed_date",
  "payedDate",
  "payment_method",
  "paymentMethod",
  "bank_info",
  "bankInfo",
  "order_status",
  "orderStatus"
];

const CAFE24_SHIPPING_KEYS = [
  "shipping_status",
  "shippingStatus",
  "delivery_status",
  "deliveryStatus",
  "shipment_status",
  "shipmentStatus",
  "shipping_status_code",
  "shippingStatusCode"
];

const CAFE24_MEMO_KEYS = [
  "order_memo",
  "orderMemo",
  "memo",
  "additional_info",
  "additionalInfo",
  "client_memo",
  "clientMemo"
];

const CAFE24_ADMIN_MEMO_KEYS = ["admin_memo", "adminMemo", "admin_order_memo", "adminOrderMemo"];
const CAFE24_CUSTOMER_MEMO_KEYS = ["customer_memo", "customerMemo", "buyer_memo", "buyerMemo"];

const CAFE24_SHIPPING_STATUS_LABELS: Record<string, string> = {
  F: "배송전",
  M: "배송중",
  T: "배송대기",
  W: "배송준비중",
  D: "배송완료",
  C: "배송취소",
  R: "반품",
  E: "교환"
};

function formatMappedStatus(value: string | null, labels: Record<string, string>): string | null {
  if (!value) return null;
  const text = value.trim();
  if (!text) return null;
  const label = labels[text.toUpperCase()];
  if (label) return `${text} / ${label}`;
  return /^[A-Z]$/i.test(text) ? `${text} / 미매핑` : text;
}

function findArraysByKeys(value: unknown, candidateKeys: string[], depth = 0): unknown[][] {
  if (depth > 8 || value === null || value === undefined) return [];
  const normalizedCandidates = new Set(candidateKeys.map(normalizeKey));
  const arrays: unknown[][] = [];

  if (isRecord(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (normalizedCandidates.has(normalizeKey(key)) && Array.isArray(item)) {
        arrays.push(item);
      }
      arrays.push(...findArraysByKeys(item, candidateKeys, depth + 1));
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      arrays.push(...findArraysByKeys(item, candidateKeys, depth + 1));
    }
  }

  return arrays;
}

function firstRecordKeysFromArrayKey(value: unknown, candidateKeys: string[]): string[] {
  for (const array of findArraysByKeys(value, candidateKeys)) {
    const firstRecord = array.find(isRecord);
    if (firstRecord) {
      return Object.keys(firstRecord).filter((key) => !isSensitiveKey(key)).sort();
    }
  }

  return [];
}

function collectCafe24ProductNames(detail: unknown): string[] {
  const names: string[] = [];
  const itemArrays = findArraysByKeys(detail, ["items", "order_items", "orderItems", "products"]);

  for (const itemArray of itemArrays) {
    for (const item of itemArray) {
      const primary = findStringByKeys(item, CAFE24_PRIMARY_PRODUCT_NAME_KEYS);
      if (primary) {
        names.push(primary);
        continue;
      }

      const fallbackValues = getStringValuesByKeys(item, CAFE24_PRODUCT_FALLBACK_KEYS);
      if (fallbackValues.length) {
        names.push(fallbackValues.join(" / "));
      }
    }
  }

  if (names.length) return Array.from(new Set(names));
  return getStringValuesByKeys(detail, CAFE24_PRODUCT_NAME_KEYS);
}

function collectCafe24ProductIdentifiers(detail: unknown): string[] {
  const identifiers: string[] = [];
  const itemArrays = findArraysByKeys(detail, ["items", "order_items", "orderItems", "products"]);

  for (const itemArray of itemArrays) {
    for (const item of itemArray) {
      identifiers.push(...getStringValuesByKeys(item, CAFE24_PRODUCT_FALLBACK_KEYS));
    }
  }

  return Array.from(new Set(identifiers));
}

export function analyzeCafe24OrderResponseShape(detail: unknown): Cafe24OrderResponseShape {
  return {
    topLevelKeys: isRecord(detail) ? Object.keys(detail).sort() : [],
    hasOrderObject: hasNestedRecordKey(detail, ["order"]),
    hasOrdersArray: hasNestedRecordKey(detail, ["orders"], true),
    hasItems: hasNestedRecordKey(detail, ["items"], true),
    hasOrderItems: hasNestedRecordKey(detail, ["order_items", "orderItems"], true),
    hasProducts: hasNestedRecordKey(detail, ["products"], true),
    firstItemKeys: firstRecordKeysFromArrayKey(detail, ["items"]),
    paymentKeys: collectMatchingKeys(detail, CAFE24_PAYMENT_KEYS),
    shippingKeys: collectMatchingKeys(detail, CAFE24_SHIPPING_KEYS),
    memoKeys: collectMatchingKeys(detail, CAFE24_MEMO_KEYS),
    adminMemoKeys: collectMatchingKeys(detail, CAFE24_ADMIN_MEMO_KEYS),
    customerMemoKeys: collectMatchingKeys(detail, CAFE24_CUSTOMER_MEMO_KEYS)
  };
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
    ...CAFE24_MEMO_KEYS,
    ...CAFE24_ADMIN_MEMO_KEYS,
    ...CAFE24_CUSTOMER_MEMO_KEYS
  ]);

  return {
    eventType: findStringByKeys(payload, ["event_type", "eventType", "event_name", "eventName", "event", "resource_type", "resourceType"]),
    eventId: findStringByKeys(payload, ["event_id", "eventId", "event_no", "eventNo", "webhook_id", "webhookId", "id"]),
    mallId: findStringByKeys(payload, ["mall_id", "mallId", "mall"]) ?? fallbackMallId ?? null,
    orderId: findStringByKeys(payload, ["order_id", "orderId", "order_code", "orderCode"]),
    orderNo: findStringByKeys(payload, ["order_no", "orderNo", "order_number", "orderNumber", "order_id", "orderId"]),
    memberId: findStringByKeys(payload, ["member_id", "memberId", "customer_id", "customerId"]),
    orderMemo,
    uploadCode: findUploadCodeInUnknown(payload) ?? extractUploadCodeFromText(orderMemo)
  };
}

export function isCafe24TestWebhookPayload(payload: unknown): boolean {
  const clientId = findStringByKeys(payload, ["client_id", "clientId"]);
  if (clientId?.toLowerCase().startsWith("sample")) return true;

  const orderId = findStringByKeys(payload, ["order_id", "orderId"]);
  const orderNo = findStringByKeys(payload, ["order_no", "orderNo", "order_number", "orderNumber"]);
  const mallId = findStringByKeys(payload, ["mall_id", "mallId", "mall"]);
  const eventType = findStringByKeys(payload, ["event_type", "eventType", "event_name", "eventName", "event", "event_no", "eventNo"]);
  const appName = findStringByKeys(payload, ["app_name", "appName"]);
  const sampleOrderId = orderId ?? orderNo;

  if (mallId === "cafe24bestshop" && sampleOrderId === "20200717-0029236" && (eventType === "90023" || eventType === "90025")) {
    return true;
  }

  return Boolean(orderId?.startsWith("Tb") && appName?.toLowerCase() === "app_name");
}

export function extractCafe24OrderSummary(
  detail: unknown,
  fallbackMallId?: string | null,
  matchedProject: Cafe24OrderProjectMatch | null = null
): Cafe24OrderSummary {
  const orderInfo = extractCafe24OrderInfo(detail, fallbackMallId);
  const buyerName = findStringByKeys(detail, [
    "buyer_name",
    "buyerName",
    "orderer_name",
    "ordererName",
    "billing_name",
    "billingName",
    "member_name",
    "memberName",
    "customer_name",
    "customerName"
  ]);
  const buyerPhone = findStringByKeys(detail, [
    "buyer_cellphone",
    "buyerCellphone",
    "buyer_phone",
    "buyerPhone",
    "orderer_phone",
    "ordererPhone",
    "orderer_cellphone",
    "ordererCellphone",
    "member_phone",
    "memberPhone",
    "customer_phone",
    "customerPhone",
    "receiver_cellphone",
    "receiverCellphone",
    "receiver_phone",
    "receiverPhone",
    "cellphone",
    "phone",
    "mobile",
    "mobilePhone"
  ]);
  const productNames = collectCafe24ProductNames(detail);
  const productIdentifiers = collectCafe24ProductIdentifiers(detail);
  const paymentStatusRaw = findStringByKeys(detail, CAFE24_PAYMENT_KEYS);
  const orderedAt = findStringByKeys(detail, [
    "ordered_date",
    "orderedDate",
    "order_date",
    "orderDate",
    "created_date",
    "createdDate",
    "payed_date",
    "payedDate"
  ]);
  const shippingStatusRaw = findStringByKeys(detail, CAFE24_SHIPPING_KEYS);
  const totalPaidAmount = findStringByKeys(detail, [
    "total_paid_amount",
    "totalPaidAmount",
    "payment_amount",
    "paymentAmount",
    "paid_amount",
    "paidAmount",
    "actual_payment_amount",
    "actualPaymentAmount",
    "order_price_amount",
    "orderPriceAmount",
    "amount"
  ]);

  return {
    orderId: orderInfo.orderId ?? null,
    orderNo: orderInfo.orderNo ?? orderInfo.orderId ?? null,
    buyerName,
    buyerPhone,
    productName: productNames.length ? productNames.join(", ") : null,
    productIdentifiers,
    paymentStatusSource: paymentStatusRaw,
    paymentStatus: paymentStatusRaw,
    orderedAt,
    shippingStatusSource: shippingStatusRaw,
    shippingStatus: formatMappedStatus(shippingStatusRaw, CAFE24_SHIPPING_STATUS_LABELS),
    totalPaidAmount,
    uploadCode: orderInfo.uploadCode ?? null,
    responseShape: analyzeCafe24OrderResponseShape(detail),
    matchedProject
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

function readDebugString(debug: Record<string, unknown>, key: keyof Cafe24WebhookSafeDebugInfo): string | null {
  const value = debug[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readDebugLookupStatus(debug: Record<string, unknown>): Cafe24OrderDetailLookupStatus | null {
  const value = readDebugString(debug, "orderDetailLookupStatus");
  const allowed = new Set<Cafe24OrderDetailLookupStatus>([
    "NOT_ATTEMPTED",
    "SKIPPED_TEST_PAYLOAD",
    "NOT_ATTEMPTED_UPLOAD_CODE_PRESENT",
    "NOT_ATTEMPTED_NO_ORDER_ID",
    "NOT_ATTEMPTED_CONFIG_MISSING",
    "ATTEMPTING",
    "SUCCESS",
    "FAILED"
  ]);

  return value && allowed.has(value as Cafe24OrderDetailLookupStatus) ? value as Cafe24OrderDetailLookupStatus : null;
}

export function appendCafe24WebhookDebugInfo(
  payloadJson: Prisma.InputJsonValue,
  debug: Cafe24WebhookSafeDebugInfo
): Prisma.InputJsonValue {
  const safeDebug: Prisma.InputJsonObject = {
    mallId: debug.mallId,
    orderId: debug.orderId,
    eventType: debug.eventType,
    tokenLookupMallId: debug.tokenLookupMallId,
    orderDetailLookupStatus: debug.orderDetailLookupStatus,
    orderDetailLookupMessage: debug.orderDetailLookupMessage,
    orderDetailLookupAt: debug.orderDetailLookupAt
  };

  if (isRecord(payloadJson)) {
    return {
      ...(payloadJson as Prisma.InputJsonObject),
      [WEBHOOK_DEBUG_KEY]: safeDebug
    };
  }

  return {
    payload: payloadJson,
    [WEBHOOK_DEBUG_KEY]: safeDebug
  };
}

export function getCafe24WebhookDebugInfo(
  event: {
    payloadJson?: unknown;
    eventType?: string | null;
    mallId?: string | null;
    orderId?: string | null;
    status?: string | null;
    errorMessage?: string | null;
  },
  fallbackMallId?: string | null
): Cafe24WebhookSafeDebugInfo {
  const debug = isRecord(event.payloadJson) && isRecord(event.payloadJson[WEBHOOK_DEBUG_KEY])
    ? event.payloadJson[WEBHOOK_DEBUG_KEY]
    : null;
  const eventStatus = event.status ?? null;
  const inferredStatus: Cafe24OrderDetailLookupStatus =
    eventStatus === "SKIPPED_TEST_PAYLOAD" ? "SKIPPED_TEST_PAYLOAD" :
      eventStatus === "ORDER_DETAIL_SYNC_FAILED" ? "FAILED" :
        "NOT_ATTEMPTED";
  const mallId = debug ? readDebugString(debug, "mallId") : null;
  const orderId = debug ? readDebugString(debug, "orderId") : null;
  const eventType = debug ? readDebugString(debug, "eventType") : null;
  const tokenLookupMallId = debug ? readDebugString(debug, "tokenLookupMallId") : null;
  const lookupStatus = debug ? readDebugLookupStatus(debug) : null;
  const message = debug ? readDebugString(debug, "orderDetailLookupMessage") : null;
  const lookupAt = debug ? readDebugString(debug, "orderDetailLookupAt") : null;
  const resolvedMallId = event.mallId?.trim() || fallbackMallId?.trim() || null;

  return {
    mallId: mallId ?? resolvedMallId,
    orderId: orderId ?? event.orderId?.trim() ?? null,
    eventType: eventType ?? event.eventType?.trim() ?? null,
    tokenLookupMallId: tokenLookupMallId ?? resolvedMallId,
    orderDetailLookupStatus: lookupStatus ?? inferredStatus,
    orderDetailLookupMessage: message ?? event.errorMessage ?? null,
    orderDetailLookupAt: lookupAt
  };
}

function normalizeScopes(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value.filter(Boolean).join(",");
  return value?.trim() || null;
}

export function getCafe24TokenTimingStatus({
  expiresAt,
  now = Date.now(),
  refreshMarginMs = CAFE24_TOKEN_REFRESH_MARGIN_MS
}: {
  expiresAt: Date;
  now?: number;
  refreshMarginMs?: number;
}): "valid" | "refresh_needed" | "expired" {
  const remainingMs = expiresAt.getTime() - now;
  if (remainingMs <= 0) return "expired";
  if (remainingMs <= refreshMarginMs) return "refresh_needed";
  return "valid";
}

export function shouldRefreshCafe24Token({
  expiresAt,
  now = Date.now(),
  refreshMarginMs = CAFE24_TOKEN_REFRESH_MARGIN_MS
}: {
  expiresAt: Date;
  now?: number;
  refreshMarginMs?: number;
}): boolean {
  return getCafe24TokenTimingStatus({ expiresAt, now, refreshMarginMs }) !== "valid";
}

function parseTokenResponse(data: Cafe24TokenResponse, fallbackRefreshToken?: string | null) {
  if (!data.access_token || (!data.refresh_token && !fallbackRefreshToken)) {
    throw new Error("Cafe24 token response did not include required token fields.");
  }

  const expiresInSeconds = Number(data.expires_in ?? 7200);
  const expiresAt = new Date(Date.now() + (Number.isFinite(expiresInSeconds) ? expiresInSeconds : 7200) * 1000);

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? fallbackRefreshToken ?? "",
    expiresAt,
    scopes: normalizeScopes(data.scope ?? data.scopes)
  };
}

async function requestCafe24Token(
  params: URLSearchParams,
  env: Cafe24Env | Record<string, string | undefined> = process.env,
  fallbackRefreshToken?: string | null,
  failureMessage = "Cafe24 token request failed. Please reconnect OAuth."
) {
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
    throw new Error(failureMessage);
  }

  const json = (await response.json()) as Cafe24TokenResponse;
  return parseTokenResponse(json, fallbackRefreshToken);
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
  const token = await requestCafe24Token(
    params,
    env,
    existing.refreshToken,
    "Cafe24 token refresh failed. Please reconnect OAuth."
  );

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

  if (shouldRefreshCafe24Token({ expiresAt: token.expiresAt })) {
    try {
      return await refreshCafe24Token({ mallId, env });
    } catch {
      throw new Error("Cafe24 token refresh failed. Please reconnect OAuth.");
    }
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
    let refreshed;
    try {
      refreshed = await refreshCafe24Token({ mallId: resolvedMallId, env });
    } catch {
      throw new Error("Cafe24 token refresh failed. Please reconnect OAuth.");
    }
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

type UploadProjectLinkCandidate = {
  id: string;
  uploadCode: string | null;
  companyName: string | null;
  customerName: string | null;
  cafe24OrderNumber: string;
  cafe24OrderId: string | null;
  cafe24OrderNo: string | null;
  linkedAt: Date | null;
};

function uniqueOrderIdentifiers(input: LinkCafe24OrderInput): string[] {
  return Array.from(new Set([
    input.orderId?.trim(),
    input.orderNo?.trim()
  ].filter((value): value is string => Boolean(value))));
}

function toCafe24OrderProjectMatch(
  project: UploadProjectLinkCandidate,
  input: LinkCafe24OrderInput,
  preferredMatchType?: Cafe24OrderProjectMatch["matchType"]
): Cafe24OrderProjectMatch {
  const orderIdentifiers = uniqueOrderIdentifiers(input);
  const matchType = preferredMatchType ??
    (project.cafe24OrderId && orderIdentifiers.includes(project.cafe24OrderId) ? "order_id" :
      project.cafe24OrderNo && orderIdentifiers.includes(project.cafe24OrderNo) ? "order_no" :
        "order_number");

  return {
    projectId: project.id,
    uploadCode: project.uploadCode,
    companyName: project.companyName,
    customerName: project.customerName,
    matchType
  };
}

function normalizeMatchText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, "").toLowerCase();
}

function normalizePhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function isSamePhone(left: string | null | undefined, right: string | null | undefined): boolean {
  const leftDigits = normalizePhone(left);
  const rightDigits = normalizePhone(right);
  if (!leftDigits || !rightDigits) return false;
  return leftDigits === rightDigits || (leftDigits.length >= 8 && rightDigits.length >= 8 && leftDigits.slice(-8) === rightDigits.slice(-8));
}

function isTextMatch(left: string | null | undefined, right: string | null | undefined): boolean {
  const normalizedLeft = normalizeMatchText(left);
  const normalizedRight = normalizeMatchText(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
}

function getOrderUploadHourDelta(uploadedAt: Date, orderedAt?: string | null): number | null {
  if (!orderedAt) return null;
  const orderTime = new Date(orderedAt);
  if (Number.isNaN(orderTime.getTime())) return null;
  return Math.abs(orderTime.getTime() - uploadedAt.getTime()) / (1000 * 60 * 60);
}

function scoreUploadProjectCandidate(
  project: {
    id: string;
    uploadCode: string | null;
    companyName: string | null;
    customerName: string;
    contactName: string | null;
    phone: string;
    productName: string;
    createdAt: Date;
  },
  input: LinkCafe24OrderInput
): Cafe24UploadProjectMatchCandidate | null {
  let score = 0;
  const reasons: string[] = [];
  const hasPhoneMatch = isSamePhone(project.phone, input.buyerPhone);

  if (hasPhoneMatch) {
    score += 55;
    reasons.push("연락처 일치");
  }

  if (isTextMatch(project.customerName, input.buyerName) || isTextMatch(project.contactName, input.buyerName) || isTextMatch(project.companyName, input.buyerName)) {
    score += 20;
    reasons.push("주문자명 일치");
  }

  if (isTextMatch(project.productName, input.productName)) {
    score += 20;
    reasons.push("상품명 일치");
  } else if ((input.productIdentifiers ?? []).some((identifier) => isTextMatch(project.productName, identifier))) {
    score += 15;
    reasons.push("상품번호 또는 옵션 후보 일치");
  }

  const hourDelta = getOrderUploadHourDelta(project.createdAt, input.orderedAt);
  if (hourDelta !== null) {
    if (hourDelta <= 6) {
      score += 15;
      reasons.push("업로드/주문 시간 6시간 이내");
    } else if (hourDelta <= 24) {
      score += 10;
      reasons.push("업로드/주문 시간 24시간 이내");
    } else if (hourDelta <= 72) {
      score += 5;
      reasons.push("업로드/주문 시간 72시간 이내");
    }
  }

  if (score < 40) return null;

  return {
    projectId: project.id,
    uploadCode: project.uploadCode,
    companyName: project.companyName,
    customerName: project.customerName,
    contactName: project.contactName,
    phone: project.phone,
    productName: project.productName,
    createdAt: project.createdAt.toISOString(),
    score,
    reasons,
    action: score >= 85 && hasPhoneMatch ? "AUTO_LINKABLE" : "REVIEW_REQUIRED"
  };
}

async function findCafe24UploadProjectMatchCandidates(input: LinkCafe24OrderInput): Promise<Cafe24UploadProjectMatchCandidate[]> {
  const projects = await prisma.uploadProject.findMany({
    where: {
      linkedAt: null,
      cafe24OrderId: null,
      cafe24OrderNo: null,
      OR: [
        { status: CAFE24_ORDER_LINK_PENDING_STATUS },
        { cafe24OrderNumber: "" }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      uploadCode: true,
      companyName: true,
      customerName: true,
      contactName: true,
      phone: true,
      productName: true,
      createdAt: true
    }
  });

  return projects
    .map((project) => scoreUploadProjectCandidate(project, input))
    .filter((candidate): candidate is Cafe24UploadProjectMatchCandidate => Boolean(candidate))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);
}

export async function findCafe24OrderMatchedProject(input: LinkCafe24OrderInput): Promise<Cafe24OrderProjectMatch | null> {
  const uploadCode = input.uploadCode ? normalizeUploadCode(input.uploadCode) : null;

  if (uploadCode) {
    const project = await prisma.uploadProject.findUnique({
      where: { uploadCode },
      select: {
        id: true,
        uploadCode: true,
        companyName: true,
        customerName: true,
        cafe24OrderNumber: true,
        cafe24OrderId: true,
        cafe24OrderNo: true,
        linkedAt: true
      }
    });

    if (project) return toCafe24OrderProjectMatch(project, input, "upload_code");
  }

  const orderIdentifiers = uniqueOrderIdentifiers(input);
  if (!orderIdentifiers.length) return null;

  const project = await prisma.uploadProject.findFirst({
    where: {
      OR: [
        { cafe24OrderId: { in: orderIdentifiers } },
        { cafe24OrderNo: { in: orderIdentifiers } },
        { cafe24OrderNumber: { in: orderIdentifiers } }
      ]
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      uploadCode: true,
      companyName: true,
      customerName: true,
      cafe24OrderNumber: true,
      cafe24OrderId: true,
      cafe24OrderNo: true,
      linkedAt: true
    }
  });

  return project ? toCafe24OrderProjectMatch(project, input) : null;
}

export async function linkCafe24OrderToUploadProject(input: LinkCafe24OrderInput): Promise<LinkCafe24OrderResult> {
  const uploadCode = input.uploadCode ? normalizeUploadCode(input.uploadCode) : null;

  const uploadCodeProject = uploadCode
    ? await prisma.uploadProject.findUnique({
      where: { uploadCode },
      select: {
        id: true,
        uploadCode: true,
        companyName: true,
        customerName: true,
        cafe24OrderNumber: true,
        cafe24OrderId: true,
        cafe24OrderNo: true,
        linkedAt: true
      }
    })
    : null;
  let project = uploadCodeProject ?? await (async () => {
    const orderIdentifiers = uniqueOrderIdentifiers(input);
    if (!orderIdentifiers.length) return null;

    return prisma.uploadProject.findFirst({
      where: {
        OR: [
          { cafe24OrderId: { in: orderIdentifiers } },
          { cafe24OrderNo: { in: orderIdentifiers } },
          { cafe24OrderNumber: { in: orderIdentifiers } }
        ]
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        uploadCode: true,
        companyName: true,
        customerName: true,
        cafe24OrderNumber: true,
        cafe24OrderId: true,
        cafe24OrderNo: true,
        linkedAt: true
      }
    });
  })();
  let autoLinkedByCandidate = false;

  if (!project) {
    const candidates = await findCafe24UploadProjectMatchCandidates(input);
    const topCandidate = candidates[0];
    const secondCandidate = candidates[1];
    const canAutoLink = Boolean(
      topCandidate &&
      topCandidate.action === "AUTO_LINKABLE" &&
      (!secondCandidate || topCandidate.score - secondCandidate.score >= 15)
    );

    if (canAutoLink && topCandidate) {
      project = await prisma.uploadProject.findUnique({
        where: { id: topCandidate.projectId },
        select: {
          id: true,
          uploadCode: true,
          companyName: true,
          customerName: true,
          cafe24OrderNumber: true,
          cafe24OrderId: true,
          cafe24OrderNo: true,
          linkedAt: true
        }
      });
      autoLinkedByCandidate = Boolean(project);
    }

    if (!project) {
      const message = candidates.length
        ? "자동 연결은 보류했습니다. 관리자 확인이 필요한 업로드 프로젝트 후보가 있습니다."
        : uploadCode
          ? `Upload project was not found for ${uploadCode}.`
          : "같은 주문번호 또는 자동 매칭 기준에 맞는 업로드 프로젝트가 없습니다.";
      await updateWebhookEventStatus({ webhookEventId: input.webhookEventId, status: "SKIPPED", message });
      return { status: "SKIPPED", message, candidates };
    }
  }

  if (!project) {
    const message = uploadCode
      ? `Upload project was not found for ${uploadCode}.`
      : "같은 주문번호를 가진 업로드 프로젝트가 없습니다.";
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
        cafe24OrderId: input.orderId?.trim() || project.cafe24OrderId,
        cafe24OrderNo: input.orderNo?.trim() || input.orderId?.trim() || project.cafe24OrderNo,
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
    projectId: project.id,
    autoLinkedByCandidate
  };
}
