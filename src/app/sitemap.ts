import type { MetadataRoute } from "next";
import { PUBLIC_PORTFOLIO_WHERE } from "@/lib/portfolio-utils";
import { prisma } from "@/lib/prisma";
import { isSiteAccessEnabled } from "@/lib/site-access";

export const dynamic = "force-dynamic";

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "http://127.0.0.1:3000");
}

async function getPublishedCaseSitemapEntries() {
  try {
    return await prisma.portfolioCase.findMany({
      where: PUBLIC_PORTFOLIO_WHERE,
      select: {
        slug: true,
        updatedAt: true
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }]
    });
  } catch (error) {
    console.error("[sitemap] Failed to load portfolio cases", error instanceof Error ? error.message : "unknown error");
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (isSiteAccessEnabled()) {
    return [];
  }

  const siteUrl = getSiteUrl();
  const cases = await getPublishedCaseSitemapEntries();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4
    },
    {
      url: `${siteUrl}/portfolio`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8
    },
    ...cases.map((caseItem) => ({
      url: `${siteUrl}/portfolio/${encodeURIComponent(caseItem.slug)}`,
      lastModified: caseItem.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
