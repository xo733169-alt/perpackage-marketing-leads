import type { NextResponse } from "next/server";

const SITE_ACCESS_COOKIE_NAME = "perpackage_site_access";
const SITE_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const SITE_ACCESS_BYPASS_PATHS = new Set([
  "/api/cafe24/oauth/start",
  "/api/cafe24/oauth/callback",
  "/api/cafe24/webhooks/orders"
]);

type SiteAccessEnv = Pick<NodeJS.ProcessEnv, "SITE_ACCESS_ENABLED" | "SITE_ACCESS_PASSWORD" | "SITE_ACCESS_SECRET" | "NODE_ENV">;

function getEnv(env: SiteAccessEnv | Record<string, string | undefined> = process.env) {
  return env;
}

function getSiteAccessPassword(env: SiteAccessEnv | Record<string, string | undefined> = process.env): string | undefined {
  return getEnv(env).SITE_ACCESS_PASSWORD?.trim() || undefined;
}

function getSiteAccessSecret(env: SiteAccessEnv | Record<string, string | undefined> = process.env): string {
  const currentEnv = getEnv(env);
  return (
    currentEnv.SITE_ACCESS_SECRET?.trim() ||
    currentEnv.SITE_ACCESS_PASSWORD?.trim() ||
    "perpackage-dev-site-access-fallback"
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

async function signSiteAccessPayload(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export function isSiteAccessEnabled(env: SiteAccessEnv | Record<string, string | undefined> = process.env): boolean {
  return getEnv(env).SITE_ACCESS_ENABLED === "true";
}

export function isSiteAccessPasswordConfigured(env: SiteAccessEnv | Record<string, string | undefined> = process.env): boolean {
  return Boolean(getSiteAccessPassword(env));
}

export function getSiteAccessCookieName(): string {
  return SITE_ACCESS_COOKIE_NAME;
}

export function getSiteAccessMaxAgeSeconds(): number {
  return SITE_ACCESS_MAX_AGE_SECONDS;
}

export function validateSiteAccessPassword(password: string, env: SiteAccessEnv | Record<string, string | undefined> = process.env): boolean {
  const configuredPassword = getSiteAccessPassword(env);
  if (!configuredPassword) return false;
  return safeEqual(password, configuredPassword);
}

export async function createSiteAccessCookieValue({
  now = Date.now(),
  nonce,
  env = process.env
}: {
  now?: number;
  nonce?: string;
  env?: SiteAccessEnv | Record<string, string | undefined>;
} = {}): Promise<string> {
  const issuedAt = String(now);
  const nonceValue = nonce ?? crypto.randomUUID();
  const payload = `site-access:${issuedAt}:${nonceValue}`;
  const signature = await signSiteAccessPayload(payload, getSiteAccessSecret(env));

  return `${issuedAt}.${nonceValue}.${signature}`;
}

export async function verifySiteAccessCookieValue(
  value: string | undefined,
  {
    now = Date.now(),
    env = process.env
  }: {
    now?: number;
    env?: SiteAccessEnv | Record<string, string | undefined>;
  } = {}
): Promise<boolean> {
  if (!value) return false;

  const [issuedAt, nonce, signature] = value.split(".");
  if (!issuedAt || !nonce || !signature) return false;

  const issuedAtMs = Number(issuedAt);
  if (!Number.isFinite(issuedAtMs)) return false;

  const ageSeconds = (now - issuedAtMs) / 1000;
  if (ageSeconds < 0 || ageSeconds > SITE_ACCESS_MAX_AGE_SECONDS) return false;

  const expectedSignature = await signSiteAccessPayload(
    `site-access:${issuedAt}:${nonce}`,
    getSiteAccessSecret(env)
  );

  return safeEqual(signature, expectedSignature);
}

export function setSiteAccessCookie(response: NextResponse, value: string, env: SiteAccessEnv | Record<string, string | undefined> = process.env): void {
  response.cookies.set(SITE_ACCESS_COOKIE_NAME, value, {
    httpOnly: true,
    maxAge: SITE_ACCESS_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: getEnv(env).NODE_ENV === "production"
  });
}

export function clearSiteAccessCookie(response: NextResponse, env: SiteAccessEnv | Record<string, string | undefined> = process.env): void {
  response.cookies.set(SITE_ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: getEnv(env).NODE_ENV === "production"
  });
}

export function sanitizeSiteAccessNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/access") || value.startsWith("/api/site-access")) return "/";
  return value;
}

export function isSiteAccessBypassPath(pathname: string): boolean {
  if (pathname === "/access") return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  if (pathname === "/favicon.ico" || pathname === "/icon.svg") return true;
  if (pathname === "/api/health") return true;
  if (SITE_ACCESS_BYPASS_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/site-access/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (/\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|avif|txt|xml|woff2?)$/i.test(pathname)) return true;
  return false;
}

export function shouldAllowRequestWithSiteAccess({
  enabled,
  pathname,
  hasValidCookie
}: {
  enabled: boolean;
  pathname: string;
  hasValidCookie: boolean;
}) {
  if (!enabled) return true;
  if (isSiteAccessBypassPath(pathname)) return true;
  return hasValidCookie;
}

export function getRobotsRulesForSiteAccess(enabled: boolean) {
  if (enabled) {
    return [{ userAgent: "*", disallow: "/" }];
  }

  return [
    {
      userAgent: "*",
      allow: ["/", "/portfolio", "/privacy"],
      disallow: ["/admin", "/api/admin", "/q"]
    }
  ];
}
