import { describe, expect, it } from "vitest";
import { getQuoteRuleChangeType, serializeQuoteRuleForLog } from "@/lib/quote-rule-log";

const baseRule = {
  id: "rule-1",
  name: "기본 싸바리박스 300~500개",
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
  notes: null,
  createdAt: new Date("2026-06-20T00:00:00"),
  updatedAt: new Date("2026-06-20T00:00:00")
};

describe("quote rule logs", () => {
  it("serializes quote rule snapshots", () => {
    const parsed = JSON.parse(serializeQuoteRuleForLog(baseRule));

    expect(parsed.name).toBe(baseRule.name);
    expect(parsed.baseUnitPriceMinKrw).toBe(3000);
  });

  it("detects activation change types", () => {
    expect(getQuoteRuleChangeType(baseRule, { ...baseRule, isActive: false })).toBe("DEACTIVATED");
    expect(getQuoteRuleChangeType({ ...baseRule, isActive: false }, { ...baseRule, isActive: true })).toBe("REACTIVATED");
    expect(getQuoteRuleChangeType(baseRule, { ...baseRule, baseUnitPriceMinKrw: 3500 })).toBe("UPDATED");
  });
});
