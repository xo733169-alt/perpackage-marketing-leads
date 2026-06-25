import type { PortfolioCase, Prisma } from "@prisma/client";
import {
  isPortfolioStatus,
  PORTFOLIO_INDUSTRY_OPTIONS,
  PORTFOLIO_PACKAGE_TYPE_OPTIONS,
  PORTFOLIO_PURPOSE_OPTIONS,
  PORTFOLIO_STRUCTURE_OPTIONS
} from "./portfolio-options";

export const PUBLIC_PORTFOLIO_WHERE: Prisma.PortfolioCaseWhereInput = {
  status: "PUBLISHED",
  publicApprovalConfirmed: true
};

export function parseStringList(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item).trim()).filter(Boolean)
      : [];
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function stringifyStringList(value: string[] | undefined): string | null {
  const cleaned = Array.from(new Set((value ?? []).map((item) => item.trim()).filter(Boolean)));
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

type PortfolioSearchParams = URLSearchParams | Record<string, string | string[] | undefined> | undefined;

function getSearchParam(searchParams: PortfolioSearchParams, key: string) {
  if (!searchParams) return "";

  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key)?.trim() ?? "";
  }

  const value = searchParams[key];
  return typeof value === "string" ? value.trim() : "";
}

export function normalizePortfolioFilterValue<T extends readonly string[]>(value: string | null | undefined, options: T): T[number] | "" {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed === "전체") return "";
  return options.includes(trimmed as T[number]) ? (trimmed as T[number]) : "";
}

export function getPortfolioFilterLabel(value: string | null | undefined) {
  return value?.trim() || "전체";
}

export function buildPortfolioCaseWhere(
  searchParams: PortfolioSearchParams,
  options: { publicOnly?: boolean; includeStatus?: boolean } = {}
): Prisma.PortfolioCaseWhereInput {
  const q = getSearchParam(searchParams, "q");
  const packageTypeParam = getSearchParam(searchParams, "packageType") || getSearchParam(searchParams, "boxType");
  const industryParam = getSearchParam(searchParams, "industry");
  const packageStructureParam = getSearchParam(searchParams, "packageStructure");
  const casePurposeParam = getSearchParam(searchParams, "casePurpose");
  const statusParam = getSearchParam(searchParams, "status");

  const packageType = normalizePortfolioFilterValue(packageTypeParam, PORTFOLIO_PACKAGE_TYPE_OPTIONS);
  const industry = normalizePortfolioFilterValue(industryParam, PORTFOLIO_INDUSTRY_OPTIONS);
  const packageStructure = normalizePortfolioFilterValue(packageStructureParam, PORTFOLIO_STRUCTURE_OPTIONS);
  const casePurpose = normalizePortfolioFilterValue(casePurposeParam, PORTFOLIO_PURPOSE_OPTIONS);

  const where: Prisma.PortfolioCaseWhereInput = {
    ...(options.publicOnly ? PUBLIC_PORTFOLIO_WHERE : {}),
    ...(packageType ? { boxType: packageType } : {}),
    ...(industry ? { industry } : {}),
    ...(packageStructure ? { packageStructure } : {}),
    ...(casePurpose ? { casePurpose } : {}),
    ...(options.includeStatus && isPortfolioStatus(statusParam) ? { status: statusParam } : {})
  };

  if (q) {
    const searchConditions: Prisma.PortfolioCaseWhereInput[] = [
      { title: { contains: q } },
      { shortDescription: { contains: q } },
      { tags: { contains: q } },
      { industry: { contains: q } },
      { boxType: { contains: q } },
      { packageStructure: { contains: q } },
      { casePurpose: { contains: q } },
      { productName: { contains: q } }
    ];

    if (!options.publicOnly) {
      searchConditions.push({ clientName: { contains: q } });
    }

    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      { OR: searchConditions }
    ];
  }

  return where;
}

export function isPublishedPortfolioCase(
  caseItem: Pick<PortfolioCase, "status" | "publicApprovalConfirmed"> | null | undefined
): boolean {
  return caseItem?.status === "PUBLISHED" && caseItem.publicApprovalConfirmed === true;
}

export function getPortfolioClientLabel(caseItem: Pick<PortfolioCase, "clientName" | "isClientNamePublic">): string {
  if (caseItem.isClientNamePublic && caseItem.clientName?.trim()) {
    return caseItem.clientName.trim();
  }

  return "브랜드 비공개";
}

export function getPortfolioSizeLabel(caseItem: Pick<PortfolioCase, "widthMm" | "depthMm" | "heightMm">): string {
  if (!caseItem.widthMm && !caseItem.depthMm && !caseItem.heightMm) return "-";
  return `${caseItem.widthMm ?? "?"} x ${caseItem.depthMm ?? "?"} x ${caseItem.heightMm ?? "?"} mm`;
}

export function getPortfolioImageAlt(caseItem: Pick<PortfolioCase, "title" | "mainImageAlt">): string {
  return caseItem.mainImageAlt?.trim() || `${caseItem.title} 제작 사례 이미지`;
}

export function getPortfolioCaseUrl(slug: string): string {
  return `/portfolio/${encodeURIComponent(slug)}`;
}

export function getPortfolioQuoteUrl(caseItem: Pick<PortfolioCase, "slug" | "title" | "industry" | "boxType">): string {
  const params = new URLSearchParams({
    sourceCaseSlug: caseItem.slug,
    sourceCaseTitle: caseItem.title,
    industry: caseItem.industry,
    boxType: caseItem.boxType,
    utm_source: "portfolio",
    utm_medium: "case_detail",
    utm_campaign: "portfolio_case"
  });

  return `/?${params.toString()}#quote`;
}
