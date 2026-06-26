import { describe, expect, it } from "vitest";
import {
  createSiteAccessCookieValue,
  getRobotsRulesForSiteAccess,
  isSiteAccessBypassPath,
  isSiteAccessEnabled,
  shouldAllowRequestWithSiteAccess,
  validateSiteAccessPassword,
  verifySiteAccessCookieValue
} from "@/lib/site-access";
import { siteAccessLoginSchema } from "@/lib/site-access-schema";

const env = {
  SITE_ACCESS_ENABLED: "true",
  SITE_ACCESS_PASSWORD: "owner-password",
  SITE_ACCESS_SECRET: "test-secret",
  NODE_ENV: "test"
};

describe("site access helpers", () => {
  it("creates and verifies a signed access cookie", async () => {
    const now = Date.parse("2026-06-20T10:00:00.000Z");
    const cookieValue = await createSiteAccessCookieValue({ now, nonce: "fixed-nonce", env });

    await expect(verifySiteAccessCookieValue(cookieValue, { now, env })).resolves.toBe(true);
  });

  it("rejects invalid or expired cookies", async () => {
    const now = Date.parse("2026-06-20T10:00:00.000Z");
    const cookieValue = await createSiteAccessCookieValue({ now, nonce: "fixed-nonce", env });
    const expiredNow = now + 8 * 24 * 60 * 60 * 1000;

    await expect(verifySiteAccessCookieValue(`${cookieValue}tampered`, { now, env })).resolves.toBe(false);
    await expect(verifySiteAccessCookieValue(cookieValue, { now: expiredNow, env })).resolves.toBe(false);
    await expect(verifySiteAccessCookieValue(undefined, { now, env })).resolves.toBe(false);
  });

  it("checks enabled mode and password without exposing raw values", () => {
    expect(isSiteAccessEnabled(env)).toBe(true);
    expect(isSiteAccessEnabled({ ...env, SITE_ACCESS_ENABLED: "false" })).toBe(false);
    expect(validateSiteAccessPassword("owner-password", env)).toBe(true);
    expect(validateSiteAccessPassword("wrong", env)).toBe(false);
  });

  it("allows disabled mode and requires access in private mode", () => {
    expect(shouldAllowRequestWithSiteAccess({ enabled: false, pathname: "/", hasValidCookie: false })).toBe(true);
    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/", hasValidCookie: false })).toBe(false);
    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/", hasValidCookie: true })).toBe(true);
    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/access", hasValidCookie: false })).toBe(true);
    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/api/health", hasValidCookie: false })).toBe(true);
    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/api/site-access/login", hasValidCookie: false })).toBe(true);
  });

  it("bypasses site access for Cafe24 external callbacks while keeping admin pages protected", () => {
    expect(isSiteAccessBypassPath("/api/cafe24/webhooks/orders")).toBe(true);
    expect(isSiteAccessBypassPath("/api/cafe24/oauth/start")).toBe(true);
    expect(isSiteAccessBypassPath("/api/cafe24/oauth/callback")).toBe(true);

    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/api/cafe24/webhooks/orders", hasValidCookie: false })).toBe(true);
    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/api/cafe24/oauth/callback", hasValidCookie: false })).toBe(true);
    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/admin/cafe24", hasValidCookie: false })).toBe(false);
    expect(shouldAllowRequestWithSiteAccess({ enabled: true, pathname: "/admin/uploads", hasValidCookie: false })).toBe(false);
  });

  it("validates login payload", () => {
    expect(siteAccessLoginSchema.safeParse({ password: "owner-password", next: "/admin/login" }).success).toBe(true);

    const result = siteAccessLoginSchema.safeParse({ password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password?.[0]).toBe("접근 비밀번호를 입력해 주세요.");
    }
  });

  it("returns private robots rules when site access is enabled", () => {
    expect(getRobotsRulesForSiteAccess(true)).toEqual([{ userAgent: "*", disallow: "/" }]);
    expect(getRobotsRulesForSiteAccess(false)[0]).toMatchObject({
      userAgent: "*",
      disallow: ["/admin", "/api/admin", "/q"]
    });
  });
});
