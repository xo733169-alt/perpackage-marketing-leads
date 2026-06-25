import { describe, expect, it } from "vitest";
import {
  generatePortfolioOverview,
  generatePortfolioSeoDescription,
  generatePortfolioSeoTitle,
  generatePortfolioShortDescription,
  generatePortfolioSlug,
  generatePortfolioTags,
  generatePortfolioTitle,
  generateSpecificationSummary
} from "@/lib/portfolio-content";

const input = {
  industry: "화장품",
  boxType: "자석박스",
  productName: "프리미엄 화장품 세트",
  quantityRange: "500~1000개",
  finishingOptions: ["무광코팅", "금박"],
  boardThickness: "1.5T",
  paperType: "아트지",
  printOption: "4도 인쇄"
};

describe("portfolio content helpers", () => {
  it("generates a URL-safe slug from Korean portfolio text", () => {
    expect(generatePortfolioSlug("화장품 브랜드용 프리미엄 자석박스 제작 사례")).toBe(
      "cosmetic-brand-premium-magnetic-box-production-case"
    );
  });

  it("generates editable Korean draft content from specs", () => {
    expect(generatePortfolioTitle(input)).toBe("프리미엄 화장품 세트 자석박스 제작 사례");
    expect(generatePortfolioShortDescription(input)).toContain("무광코팅, 금박");
    expect(generatePortfolioSeoTitle(input)).toBe("화장품 자석박스 제작 사례 | 페르패키지");
    expect(generatePortfolioSeoDescription(input)).toContain("맞춤 패키지 제작 상담");
    expect(generatePortfolioOverview(input)).toContain("제작 수량은 500~1000개");
    expect(generateSpecificationSummary(input)).toContain("보드 두께: 1.5T");
  });

  it("deduplicates generated tags", () => {
    expect(generatePortfolioTags({ ...input, finishingOptions: ["금박", "금박"] })).toEqual([
      "화장품",
      "자석박스",
      "프리미엄 화장품 세트",
      "500~1000개",
      "금박"
    ]);
  });
});
