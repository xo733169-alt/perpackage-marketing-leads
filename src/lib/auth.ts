import crypto from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "perpackage_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD?.trim() || undefined;
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPassword());
}

function signSession(issuedAt: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`admin:${issuedAt}`).digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionValue(): string {
  const secret = getAdminPassword();
  if (!secret) throw new Error("ADMIN_PASSWORD is not configured.");

  const issuedAt = Date.now().toString();
  return `${issuedAt}.${signSession(issuedAt, secret)}`;
}

export function verifyAdminSessionValue(value: string | undefined): boolean {
  const secret = getAdminPassword();
  if (!secret || !value) return false;

  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;

  const issuedTime = Number(issuedAt);
  if (!Number.isFinite(issuedTime)) return false;

  const ageSeconds = (Date.now() - issuedTime) / 1000;
  if (ageSeconds < 0 || ageSeconds > ADMIN_SESSION_MAX_AGE_SECONDS) return false;

  return safeEqual(signature, signSession(issuedAt, secret));
}

export function isAdminAuthenticated(): boolean {
  const session = cookies().get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSessionValue(session);
}

export function setAdminSessionCookie(): void {
  cookies().set(ADMIN_COOKIE_NAME, createAdminSessionValue(), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearAdminSessionCookie(): void {
  cookies().set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export function validateAdminPassword(password: string): boolean {
  const configuredPassword = getAdminPassword();
  if (!configuredPassword) return false;
  return safeEqual(password, configuredPassword);
}

export function isAllowedMutationOrigin(request: Request): boolean {
  const requestUrl = new URL(request.url);
  const allowedOrigins = new Set<string>([requestUrl.origin]);
  const host = request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (host) {
    allowedOrigins.add(`${forwardedProto ?? requestUrl.protocol.replace(":", "")}://${host}`);
  }

  if (siteUrl) {
    try {
      allowedOrigins.add(new URL(siteUrl).origin);
    } catch {
      // Ignore a malformed optional site URL and keep request-bound origins.
    }
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin) return allowedOrigins.has(origin);

  if (referer) {
    try {
      return allowedOrigins.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return true;
}
