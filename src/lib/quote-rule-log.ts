import type { QuoteRule } from "@prisma/client";

export const QUOTE_RULE_CHANGE_TYPES = ["CREATED", "UPDATED", "DEACTIVATED", "REACTIVATED", "DELETED"] as const;

export type QuoteRuleChangeType = (typeof QUOTE_RULE_CHANGE_TYPES)[number];

export const QUOTE_RULE_CHANGE_TYPE_LABELS: Record<QuoteRuleChangeType, string> = {
  CREATED: "생성",
  UPDATED: "수정",
  DEACTIVATED: "비활성화",
  REACTIVATED: "재활성화",
  DELETED: "삭제"
};

export function serializeQuoteRuleForLog(rule: QuoteRule): string {
  return JSON.stringify({
    id: rule.id,
    name: rule.name,
    isActive: rule.isActive,
    boxType: rule.boxType,
    quantityRange: rule.quantityRange,
    minQuantity: rule.minQuantity,
    maxQuantity: rule.maxQuantity,
    baseUnitPriceMinKrw: rule.baseUnitPriceMinKrw,
    baseUnitPriceMaxKrw: rule.baseUnitPriceMaxKrw,
    sizeSmallThreshold: rule.sizeSmallThreshold,
    sizeMediumThreshold: rule.sizeMediumThreshold,
    sizeLargeThreshold: rule.sizeLargeThreshold,
    smallSizeMultiplier: rule.smallSizeMultiplier,
    mediumSizeMultiplier: rule.mediumSizeMultiplier,
    largeSizeMultiplier: rule.largeSizeMultiplier,
    extraLargeSizeMultiplier: rule.extraLargeSizeMultiplier,
    printNoneMultiplier: rule.printNoneMultiplier,
    printOneColorMultiplier: rule.printOneColorMultiplier,
    printFullColorMultiplier: rule.printFullColorMultiplier,
    printFoilEmbossMultiplier: rule.printFoilEmbossMultiplier,
    finishingBaseAddMinKrw: rule.finishingBaseAddMinKrw,
    finishingBaseAddMaxKrw: rule.finishingBaseAddMaxKrw,
    complexityLowMultiplier: rule.complexityLowMultiplier,
    complexityNormalMultiplier: rule.complexityNormalMultiplier,
    complexityHighMultiplier: rule.complexityHighMultiplier,
    complexityVeryHighMultiplier: rule.complexityVeryHighMultiplier,
    minOrderPriceKrw: rule.minOrderPriceKrw,
    notes: rule.notes
  });
}

export function getQuoteRuleChangeType(before: QuoteRule, after: QuoteRule): QuoteRuleChangeType {
  if (before.isActive && !after.isActive) return "DEACTIVATED";
  if (!before.isActive && after.isActive) return "REACTIVATED";
  return "UPDATED";
}
