import { BOX_TYPE_OPTIONS, QUANTITY_RANGE_OPTIONS } from "./lead-options";
import type { QuoteRuleConfig } from "./quote-engine";

type BasePrice = {
  min: number;
  max: number;
  minOrder: number;
};

const quantitySettings: Record<
  string,
  { minQuantity: number | null; maxQuantity: number | null; quantityFactor: number; minOrderFactor: number }
> = {
  "100개 이하": { minQuantity: 1, maxQuantity: 100, quantityFactor: 1.25, minOrderFactor: 1.1 },
  "100~300개": { minQuantity: 100, maxQuantity: 300, quantityFactor: 1.08, minOrderFactor: 1 },
  "300~500개": { minQuantity: 300, maxQuantity: 500, quantityFactor: 1, minOrderFactor: 1 },
  "500~1000개": { minQuantity: 500, maxQuantity: 1000, quantityFactor: 0.88, minOrderFactor: 0.95 },
  "1000개 이상": { minQuantity: 1000, maxQuantity: null, quantityFactor: 0.78, minOrderFactor: 0.9 },
  "아직 미정": { minQuantity: null, maxQuantity: null, quantityFactor: 1, minOrderFactor: 1 }
};

const basePrices: Record<string, BasePrice> = {
  싸바리박스: { min: 3000, max: 6000, minOrder: 800000 },
  자석박스: { min: 4200, max: 8500, minOrder: 1000000 },
  상하짝박스: { min: 3000, max: 6500, minOrder: 800000 },
  서랍형박스: { min: 4200, max: 9000, minOrder: 1000000 },
  단상자: { min: 900, max: 2200, minOrder: 500000 },
  "아직 모르겠음": { min: 2500, max: 7000, minOrder: 700000 },
  기타: { min: 2500, max: 7500, minOrder: 700000 }
};

function roundToHundred(value: number): number {
  return Math.max(0, Math.round(value / 100) * 100);
}

export function buildDefaultQuoteRules(): QuoteRuleConfig[] {
  return BOX_TYPE_OPTIONS.flatMap((boxType) =>
    QUANTITY_RANGE_OPTIONS.map((quantityRange) => {
      const base = basePrices[boxType] ?? basePrices["기타"];
      const quantity = quantitySettings[quantityRange];

      return {
        name: `기본 ${boxType} ${quantityRange}`,
        isActive: true,
        boxType,
        quantityRange,
        minQuantity: quantity.minQuantity,
        maxQuantity: quantity.maxQuantity,
        baseUnitPriceMinKrw: roundToHundred(base.min * quantity.quantityFactor),
        baseUnitPriceMaxKrw: roundToHundred(base.max * quantity.quantityFactor),
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
        finishingBaseAddMinKrw: boxType === "단상자" ? 80 : 250,
        finishingBaseAddMaxKrw: boxType === "단상자" ? 220 : 700,
        complexityLowMultiplier: 0.95,
        complexityNormalMultiplier: 1,
        complexityHighMultiplier: 1.18,
        complexityVeryHighMultiplier: 1.35,
        minOrderPriceKrw: roundToHundred(base.minOrder * quantity.minOrderFactor),
        notes: "기본 placeholder 룰입니다. 운영 전 실제 제작 단가와 공정 기준에 맞게 반드시 검토하세요."
      };
    })
  );
}

export const DEFAULT_QUOTE_RULES = buildDefaultQuoteRules();
