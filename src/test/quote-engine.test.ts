import { describe, expect, it } from "vitest";
import {
  calculateComplexityLevel,
  calculateReferenceQuote,
  calculateSizeCategory,
  formatReferenceQuoteRange,
  getMissingQuoteFields,
  getQuoteConfidenceLevel,
  getQuoteDisclaimer,
  selectQuoteRule,
  toPublicReferenceQuotePreview,
  type QuoteRuleConfig
} from "@/lib/quote-engine";

const baseRule: QuoteRuleConfig = {
  id: "rule-1",
  name: "테스트 싸바리박스 300~500개",
  isActive: true,
  boxType: "싸바리박스",
  quantityRange: "300~500개",
  minQuantity: 300,
  maxQuantity: 500,
  baseUnitPriceMinKrw: 3000,
  baseUnitPriceMaxKrw: 6000,
  sizeSmallThreshold: 500000,
  sizeMediumThreshold: 2000000,
  sizeLargeThreshold: 6000000,
  smallSizeMultiplier: 0.9,
  mediumSizeMultiplier: 1,
  largeSizeMultiplier: 1.25,
  extraLargeSizeMultiplier: 1.55,
  printNoneMultiplier: 1,
  printOneColorMultiplier: 1.08,
  printFullColorMultiplier: 1.18,
  printFoilEmbossMultiplier: 1.3,
  finishingBaseAddMinKrw: 250,
  finishingBaseAddMaxKrw: 700,
  complexityLowMultiplier: 0.95,
  complexityNormalMultiplier: 1,
  complexityHighMultiplier: 1.18,
  complexityVeryHighMultiplier: 1.35,
  minOrderPriceKrw: 800000,
  notes: "테스트용 룰"
};

describe("quote engine", () => {
  it("selects an active exact quote rule", () => {
    const rule = selectQuoteRule(
      { boxType: "싸바리박스", quantityRange: "300~500개" },
      [{ ...baseRule, isActive: false }, baseRule]
    );

    expect(rule?.name).toBe("테스트 싸바리박스 300~500개");
  });

  it("calculates size category from dimensions", () => {
    expect(calculateSizeCategory({ widthMm: 100, depthMm: 100, heightMm: 40 })).toBe("SMALL");
    expect(calculateSizeCategory({ widthMm: 200, depthMm: 150, heightMm: 80 })).toBe("LARGE");
    expect(calculateSizeCategory({ widthMm: "", depthMm: 150, heightMm: 80 })).toBe("UNKNOWN");
  });

  it("calculates complexity level from finishing and structure", () => {
    expect(
      calculateComplexityLevel({
        boxType: "단상자",
        printOption: "무지",
        finishingOptions: []
      })
    ).toBe("LOW");

    expect(
      calculateComplexityLevel({
        boxType: "자석박스",
        printOption: "4도 인쇄",
        finishingOptions: ["금박"]
      })
    ).toBe("HIGH");

    expect(
      calculateComplexityLevel({
        boxType: "싸바리박스",
        quantityRange: "100개 이하",
        finishingOptions: ["금박", "형압", "리본"]
      })
    ).toBe("VERY_HIGH");
  });

  it("calculates confidence and missing fields safely", () => {
    expect(getQuoteConfidenceLevel({ boxType: "아직 모르겠음", quantityRange: "아직 미정" })).toBe("LOW");
    expect(getQuoteConfidenceLevel({ boxType: "싸바리박스", quantityRange: "300~500개" })).toBe("MEDIUM");
    expect(
      getQuoteConfidenceLevel({
        boxType: "싸바리박스",
        quantityRange: "300~500개",
        widthMm: 200,
        depthMm: 150,
        heightMm: 80,
        printOption: "4도 인쇄"
      })
    ).toBe("HIGH");

    expect(getMissingQuoteFields({})).toEqual(["박스 종류", "제작 수량", "가로", "세로", "높이", "인쇄 여부"]);
  });

  it("returns reference-only range and disclaimer", () => {
    const result = calculateReferenceQuote(
      {
        boxType: "싸바리박스",
        quantityRange: "300~500개",
        widthMm: 200,
        depthMm: 150,
        heightMm: 80,
        printOption: "4도 인쇄",
        finishingOptions: ["금박"]
      },
      [baseRule]
    );

    expect(result.estimatedUnitPriceMinKrw).toBeGreaterThan(0);
    expect(result.estimatedTotalPriceMinKrw).toBeGreaterThanOrEqual(baseRule.minOrderPriceKrw);
    expect(result.estimateLabel).toContain("개당 약");
    expect(result.estimateLabel).toContain("총 약");
    expect(result.estimateDisclaimer).toBe(getQuoteDisclaimer());
    expect(result.calculationNotes.some((note) => note.includes(baseRule.name))).toBe(true);
  });

  it("falls back safely when important fields are incomplete", () => {
    const result = calculateReferenceQuote({ boxType: "아직 모르겠음", quantityRange: "300~500개" }, [baseRule]);

    expect(result.estimatedUnitPriceMinKrw).toBeNull();
    expect(result.estimateLabel).toBe("상담 후 사양에 맞춰 안내");
    expect(result.estimateDisclaimer).toBe(getQuoteDisclaimer());
  });

  it("formats reference ranges", () => {
    expect(
      formatReferenceQuoteRange({
        estimatedUnitPriceMinKrw: 3000,
        estimatedUnitPriceMaxKrw: 6000,
        estimatedTotalPriceMinKrw: 1200000,
        estimatedTotalPriceMaxKrw: 2400000
      })
    ).toBe("개당 약 3,000원~6,000원, 총 약 1,200,000원~2,400,000원 상담 필요");
  });

  it("returns only public-safe preview fields", () => {
    const result = calculateReferenceQuote(
      {
        boxType: "싸바리박스",
        quantityRange: "300~500개",
        widthMm: 200,
        depthMm: 150,
        heightMm: 80,
        printOption: "4도 인쇄"
      },
      [baseRule]
    );
    const preview = toPublicReferenceQuotePreview(result);

    expect(preview.canShowNumericEstimate).toBe(true);
    expect(preview.unitPriceRangeLabel).toContain("개당 약");
    expect("appliedRuleName" in preview).toBe(false);
    expect("calculationNotes" in preview).toBe(false);
  });
});
