import type { MetadataRoute } from "next";
import { getRobotsRulesForSiteAccess, isSiteAccessEnabled } from "@/lib/site-access";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "http://127.0.0.1:3000";
}

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: getRobotsRulesForSiteAccess(isSiteAccessEnabled()),
    sitemap: isSiteAccessEnabled() ? undefined : `${siteUrl}/sitemap.xml`
  };
}
