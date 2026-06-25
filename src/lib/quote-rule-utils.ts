import type { Prisma, QuoteRule } from "@prisma/client";
import type { QuoteRuleInput } from "./quote-rule-schema";
import type { QuoteRuleConfig } from "./quote-engine";

export function toQuoteRuleConfig(rule: QuoteRule): QuoteRuleConfig {
  return {
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
  };
}

export function toQuoteRuleCreateData(input: QuoteRuleInput): Prisma.QuoteRuleUncheckedCreateInput {
  return {
    name: input.name,
    isActive: input.isActive,
    boxType: input.boxType,
    quantityRange: input.quantityRange,
    minQuantity: input.minQuantity ?? null,
    maxQuantity: input.maxQuantity ?? null,
    baseUnitPriceMinKrw: input.baseUnitPriceMinKrw,
    baseUnitPriceMaxKrw: input.baseUnitPriceMaxKrw,
    sizeSmallThreshold: input.sizeSmallThreshold,
    sizeMediumThreshold: input.sizeMediumThreshold,
    sizeLargeThreshold: input.sizeLargeThreshold,
    smallSizeMultiplier: input.smallSizeMultiplier,
    mediumSizeMultiplier: input.mediumSizeMultiplier,
    largeSizeMultiplier: input.largeSizeMultiplier,
    extraLargeSizeMultiplier: input.extraLargeSizeMultiplier,
    printNoneMultiplier: input.printNoneMultiplier,
    printOneColorMultiplier: input.printOneColorMultiplier,
    printFullColorMultiplier: input.printFullColorMultiplier,
    printFoilEmbossMultiplier: input.printFoilEmbossMultiplier,
    finishingBaseAddMinKrw: input.finishingBaseAddMinKrw,
    finishingBaseAddMaxKrw: input.finishingBaseAddMaxKrw,
    complexityLowMultiplier: input.complexityLowMultiplier,
    complexityNormalMultiplier: input.complexityNormalMultiplier,
    complexityHighMultiplier: input.complexityHighMultiplier,
    complexityVeryHighMultiplier: input.complexityVeryHighMultiplier,
    minOrderPriceKrw: input.minOrderPriceKrw,
    notes: input.notes ?? null
  };
}

export function toQuoteRuleUpdateData(input: QuoteRuleInput): Prisma.QuoteRuleUncheckedUpdateInput {
  return toQuoteRuleCreateData(input);
}

export function parseJsonStringList(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

export function stringifyStringList(value: string[]): string | null {
  const cleaned = value.map((item) => item.trim()).filter(Boolean);
  return cleaned.length ? JSON.stringify(cleaned) : null;
}
