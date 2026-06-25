import { calculateReferenceQuote, getQuoteDisclaimer } from "./quote-engine";

export const ESTIMATE_NOTICE = getQuoteDisclaimer();

export const ESTIMATE_EMPTY_MESSAGE =
  "박스 종류, 제작 수량, 사이즈, 인쇄 여부를 입력하면 참고용 예상 범위를 더 정확하게 확인할 수 있습니다.";

type EstimateInput = {
  boxType?: string | null;
  quantityRange?: string | null;
};

// Legacy compatibility wrapper. New code should use src/lib/quote-engine.ts directly.
export function getEstimatedPriceRange(input: EstimateInput): string {
  const result = calculateReferenceQuote(input);
  return `${result.estimateLabel}. ${result.estimateDisclaimer}`;
}

export function getEstimatePreview(input: EstimateInput): string {
  if (!input.boxType || !input.quantityRange) {
    return ESTIMATE_EMPTY_MESSAGE;
  }

  return getEstimatedPriceRange(input);
}
