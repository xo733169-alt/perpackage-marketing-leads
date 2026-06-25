import { describe, expect, it } from "vitest";
import { getPortfolioSeoChecklist, getPortfolioSeoPreview, getPortfolioSeoStatus } from "@/lib/portfolio-seo";

const completeCase = {
  title: "화장품 자석박스 제작 사례",
  slug: "cosmetic-magnetic-box-case",
  industry: "화장품",
  boxType: "자석박스",
  mainImageUrl: "https://example.com/image.jpg",
  mainImageAlt: "화장품 자석박스 대표 이미지",
  shortDescription: "화장품 브랜드용 자석박스 제작 사례입니다.",
  productionPoint: "무광코팅과 금박 포인트를 함께 검토했습니다.",
  specificationSummary: "업종: 화장품\n박스 종류: 자석박스",
  seoTitle: "화장품 자석박스 제작 사례 | 페르패키지",
  seoDescription: "화장품 브랜드용 자석박스 제작 사례입니다. 구조, 인쇄, 후가공 조건에 맞춰 제작 상담을 도와드립니다.",
  tags: JSON.stringify(["화장품", "자석박스"])
};

describe("portfolio seo helpers", () => {
  it("returns GOOD when practical SEO checklist is complete", () => {
    expect(getPortfolioSeoStatus(completeCase)).toBe("GOOD");
  });

  it("returns MISSING_REQUIRED when required SEO fields are missing", () => {
    expect(getPortfolioSeoStatus({ ...completeCase, seoTitle: "" })).toBe("MISSING_REQUIRED");
  });

  it("warns when image URL exists without alt text", () => {
    const checklist = getPortfolioSeoChecklist({ ...completeCase, mainImageAlt: "" });
    expect(checklist.find((item) => item.key === "imageAlt")?.passed).toBe(false);
    expect(getPortfolioSeoStatus({ ...completeCase, mainImageAlt: "" })).toBe("NEEDS_WORK");
  });

  it("builds SEO preview with fallback values and length warnings", () => {
    const preview = getPortfolioSeoPreview({
      ...completeCase,
      seoTitle: "",
      seoDescription: ""
    });

    expect(preview.title).toBe("화장품 자석박스 제작 사례 | 페르패키지");
    expect(preview.description).toBe(completeCase.shortDescription);
  });
});
