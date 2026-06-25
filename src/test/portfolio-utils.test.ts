import { describe, expect, it } from "vitest";
import {
  PORTFOLIO_INDUSTRY_OPTIONS,
  PORTFOLIO_PACKAGE_TYPE_OPTIONS,
  PORTFOLIO_PURPOSE_OPTIONS,
  PORTFOLIO_STRUCTURE_OPTIONS
} from "@/lib/portfolio-options";
import {
  buildPortfolioCaseWhere,
  getPortfolioClientLabel,
  getPortfolioImageAlt,
  getPortfolioQuoteUrl,
  getPortfolioSizeLabel,
  isPublishedPortfolioCase,
  normalizePortfolioFilterValue,
  parseStringList,
  PUBLIC_PORTFOLIO_WHERE,
  stringifyStringList
} from "@/lib/portfolio-utils";

describe("portfolio utils", () => {
  it("detects public visibility by published status", () => {
    expect(isPublishedPortfolioCase({ status: "PUBLISHED", publicApprovalConfirmed: true })).toBe(true);
    expect(isPublishedPortfolioCase({ status: "PUBLISHED", publicApprovalConfirmed: false })).toBe(false);
    expect(isPublishedPortfolioCase({ status: "DRAFT", publicApprovalConfirmed: true })).toBe(false);
    expect(isPublishedPortfolioCase(null)).toBe(false);
  });

  it("hides client names unless explicitly public", () => {
    expect(getPortfolioClientLabel({ clientName: "테스트 브랜드", isClientNamePublic: false })).toBe("브랜드 비공개");
    expect(getPortfolioClientLabel({ clientName: "테스트 브랜드", isClientNamePublic: true })).toBe("테스트 브랜드");
  });

  it("serializes and parses list fields consistently", () => {
    const serialized = stringifyStringList(["금박", "무광코팅", "금박", ""]);
    expect(serialized).toBe(JSON.stringify(["금박", "무광코팅"]));
    expect(parseStringList(serialized)).toEqual(["금박", "무광코팅"]);
    expect(parseStringList("금박, 무광코팅")).toEqual(["금박", "무광코팅"]);
  });

  it("normalizes portfolio filter values against allowed options", () => {
    expect(normalizePortfolioFilterValue(PORTFOLIO_PACKAGE_TYPE_OPTIONS[0], PORTFOLIO_PACKAGE_TYPE_OPTIONS)).toBe(
      PORTFOLIO_PACKAGE_TYPE_OPTIONS[0]
    );
    expect(normalizePortfolioFilterValue("", PORTFOLIO_PACKAGE_TYPE_OPTIONS)).toBe("");
    expect(normalizePortfolioFilterValue("전체", PORTFOLIO_PACKAGE_TYPE_OPTIONS)).toBe("");
    expect(normalizePortfolioFilterValue("없는 값", PORTFOLIO_PACKAGE_TYPE_OPTIONS)).toBe("");
  });

  it("builds portfolio where conditions from filter params", () => {
    const packageType = PORTFOLIO_PACKAGE_TYPE_OPTIONS[0];
    const industry = PORTFOLIO_INDUSTRY_OPTIONS[0];
    const packageStructure = PORTFOLIO_STRUCTURE_OPTIONS[0];
    const casePurpose = PORTFOLIO_PURPOSE_OPTIONS[0];
    const where = buildPortfolioCaseWhere(
      {
        packageType,
        industry,
        packageStructure,
        casePurpose,
        status: "PUBLISHED"
      },
      { includeStatus: true }
    );

    expect(where).toMatchObject({
      boxType: packageType,
      industry,
      packageStructure,
      casePurpose,
      status: "PUBLISHED"
    });
  });

  it("keeps public portfolio filters restricted to approved published cases", () => {
    const where = buildPortfolioCaseWhere(
      {
        packageType: PORTFOLIO_PACKAGE_TYPE_OPTIONS[0],
        q: "브랜드"
      },
      { publicOnly: true }
    );

    expect(where).toMatchObject({
      ...PUBLIC_PORTFOLIO_WHERE,
      boxType: PORTFOLIO_PACKAGE_TYPE_OPTIONS[0]
    });
    expect(where.AND).toBeTruthy();
  });

  it("keeps private client name search out of public portfolio queries", () => {
    const adminWhere = buildPortfolioCaseWhere({ q: "고객사" });
    const publicWhere = buildPortfolioCaseWhere({ q: "고객사" }, { publicOnly: true });

    expect(JSON.stringify(adminWhere)).toContain("clientName");
    expect(JSON.stringify(publicWhere)).not.toContain("clientName");
  });

  it("builds quote CTA URLs with source case tracking", () => {
    const url = getPortfolioQuoteUrl({
      slug: "cosmetic-magnetic-box",
      title: "화장품 자석박스 제작 사례",
      industry: "화장품",
      boxType: "자석박스"
    });

    const parsed = new URL(url, "http://localhost:3000");

    expect(parsed.searchParams.get("sourceCaseSlug")).toBe("cosmetic-magnetic-box");
    expect(parsed.searchParams.get("sourceCaseTitle")).toBe("화장품 자석박스 제작 사례");
    expect(parsed.searchParams.get("boxType")).toBe("자석박스");
    expect(parsed.searchParams.get("utm_source")).toBe("portfolio");
    expect(parsed.hash).toBe("#quote");
  });

  it("formats partial size values safely", () => {
    expect(getPortfolioSizeLabel({ widthMm: 120, depthMm: 80, heightMm: 45 })).toBe("120 x 80 x 45 mm");
    expect(getPortfolioSizeLabel({ widthMm: null, depthMm: null, heightMm: null })).toBe("-");
  });

  it("uses image alt fallback when custom alt text is missing", () => {
    expect(getPortfolioImageAlt({ title: "화장품 자석박스 제작 사례", mainImageAlt: "" })).toBe(
      "화장품 자석박스 제작 사례 제작 사례 이미지"
    );
    expect(getPortfolioImageAlt({ title: "화장품 자석박스 제작 사례", mainImageAlt: "대표 이미지 설명" })).toBe(
      "대표 이미지 설명"
    );
  });
});
