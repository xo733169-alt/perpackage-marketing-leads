import { DEFAULT_QUOTE_RULES } from "./default-quote-rules";

export const QUOTE_ESTIMATE_DISCLAIMER =
  "표시된 금액은 참고용 예상 범위이며, 최종 견적은 종이, 구조, 인쇄, 후가공, 수량, 제작 난이도 확인 후 상담을 통해 안내드립니다.";

export type QuoteSizeCategory = "UNKNOWN" | "SMALL" | "MEDIUM" | "LARGE" | "EXTRA_LARGE";
export type QuoteComplexityLevel = "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";
export type QuoteConfidenceLevel = "LOW" | "MEDIUM" | "HIGH";

export type QuoteInput = {
  boxType?: string | null;
  quantityRange?: string | null;
  widthMm?: number | string | null;
  depthMm?: number | string | null;
  heightMm?: number | string | null;
  printOption?: string | null;
  finishingOptions?: string[] | null;
};

export type QuoteRuleConfig = {
  id?: string;
  name: string;
  isActive: boolean;
  boxType: string;
  quantityRange: string;
  minQuantity: number | null;
  maxQuantity: number | null;
  baseUnitPriceMinKrw: number;
  baseUnitPriceMaxKrw: number;
  sizeSmallThreshold: number;
  sizeMediumThreshold: number;
  sizeLargeThreshold: number;
  smallSizeMultiplier: number;
  mediumSizeMultiplier: number;
  largeSizeMultiplier: number;
  extraLargeSizeMultiplier: number;
  printNoneMultiplier: number;
  printOneColorMultiplier: number;
  printFullColorMultiplier: number;
  printFoilEmbossMultiplier: number;
  finishingBaseAddMinKrw: number;
  finishingBaseAddMaxKrw: number;
  complexityLowMultiplier: number;
  complexityNormalMultiplier: number;
  complexityHighMultiplier: number;
  complexityVeryHighMultiplier: number;
  minOrderPriceKrw: number;
  notes?: string | null;
};

export type ReferenceQuoteResult = {
  estimatedUnitPriceMinKrw: number | null;
  estimatedUnitPriceMaxKrw: number | null;
  estimatedTotalPriceMinKrw: number | null;
  estimatedTotalPriceMaxKrw: number | null;
  estimateLabel: string;
  estimateDisclaimer: string;
  complexityLevel: QuoteComplexityLevel;
  confidenceLevel: QuoteConfidenceLevel;
  sizeCategory: QuoteSizeCategory;
  calculationNotes: string[];
  missingFields: string[];
  appliedRuleName: string | null;
  appliedRuleId: string | null;
};

export type PublicReferenceQuotePreview = {
  estimateLabel: string;
  estimateDisclaimer: string;
  unitPriceRangeLabel: string | null;
  totalPriceRangeLabel: string | null;
  complexityLabel: string;
  confidenceLabel: string;
  missingFields: string[];
  canShowNumericEstimate: boolean;
};

const specialFinishingOptions = new Set(["자석", "리본", "스펀지", "PET창", "칸막이", "금박", "은박", "형압"]);
const complexBoxTypes = new Set(["자석박스", "서랍형박스"]);

export const QUOTE_COMPLEXITY_LABELS: Record<QuoteComplexityLevel, string> = {
  LOW: "낮음",
  NORMAL: "보통",
  HIGH: "높음",
  VERY_HIGH: "매우 높음"
};

export const QUOTE_CONFIDENCE_LABELS: Record<QuoteConfidenceLevel, string> = {
  LOW: "낮음",
  MEDIUM: "보통",
  HIGH: "높음"
};

export const QUOTE_SIZE_LABELS: Record<QuoteSizeCategory, string> = {
  UNKNOWN: "사이즈 미정",
  SMALL: "소형",
  MEDIUM: "중형",
  LARGE: "대형",
  EXTRA_LARGE: "초대형"
};

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function roundToHundred(value: number): number {
  return Math.max(0, Math.round(value / 100) * 100);
}

function formatKrw(value: number): string {
  return `${new Intl.NumberFormat("ko-KR").format(value)}원`;
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

export function normalizeQuantityRange(input: QuoteInput) {
  const quantityRange = normalizeText(input.quantityRange);

  switch (quantityRange) {
    case "100개 이하":
      return { quantityRange, representativeQuantity: 100, minQuantity: 1, maxQuantity: 100 };
    case "100~300개":
      return { quantityRange, representativeQuantity: 200, minQuantity: 100, maxQuantity: 300 };
    case "300~500개":
      return { quantityRange, representativeQuantity: 400, minQuantity: 300, maxQuantity: 500 };
    case "500~1000개":
      return { quantityRange, representativeQuantity: 750, minQuantity: 500, maxQuantity: 1000 };
    case "1000개 이상":
      return { quantityRange, representativeQuantity: 1000, minQuantity: 1000, maxQuantity: null };
    case "아직 미정":
      return { quantityRange, representativeQuantity: null, minQuantity: null, maxQuantity: null };
    default:
      return { quantityRange, representativeQuantity: null, minQuantity: null, maxQuantity: null };
  }
}

export function getQuoteDisclaimer(): string {
  return QUOTE_ESTIMATE_DISCLAIMER;
}

export function getMissingQuoteFields(input: QuoteInput): string[] {
  const missingFields: string[] = [];

  if (!normalizeText(input.boxType) || input.boxType === "아직 모르겠음") missingFields.push("박스 종류");
  if (!normalizeText(input.quantityRange) || input.quantityRange === "아직 미정") missingFields.push("제작 수량");
  if (!toNumber(input.widthMm)) missingFields.push("가로");
  if (!toNumber(input.depthMm)) missingFields.push("세로");
  if (!toNumber(input.heightMm)) missingFields.push("높이");
  if (!normalizeText(input.printOption) || input.printOption === "아직 미정") missingFields.push("인쇄 여부");

  return missingFields;
}

export function calculateSizeCategory(input: QuoteInput, rule?: QuoteRuleConfig | null): QuoteSizeCategory {
  const width = toNumber(input.widthMm);
  const depth = toNumber(input.depthMm);
  const height = toNumber(input.heightMm);

  if (!width || !depth || !height) return "UNKNOWN";

  const volume = width * depth * height;
  const small = rule?.sizeSmallThreshold ?? 500000;
  const medium = rule?.sizeMediumThreshold ?? 2000000;
  const large = rule?.sizeLargeThreshold ?? 6000000;

  if (volume <= small) return "SMALL";
  if (volume <= medium) return "MEDIUM";
  if (volume <= large) return "LARGE";
  return "EXTRA_LARGE";
}

export function calculateComplexityLevel(input: QuoteInput): QuoteComplexityLevel {
  const finishingOptions = input.finishingOptions ?? [];
  const specialCount = finishingOptions.filter((option) => specialFinishingOptions.has(option)).length;
  const sizeCategory = calculateSizeCategory(input);
  const quantityRange = normalizeText(input.quantityRange);
  const boxType = normalizeText(input.boxType);

  if (
    specialCount >= 3 ||
    (specialCount >= 2 && sizeCategory === "EXTRA_LARGE") ||
    (quantityRange === "100개 이하" && specialCount >= 2)
  ) {
    return "VERY_HIGH";
  }

  if (specialCount >= 1 || complexBoxTypes.has(boxType) || sizeCategory === "LARGE" || sizeCategory === "EXTRA_LARGE") {
    return "HIGH";
  }

  if (finishingOptions.length === 0 && (boxType === "단상자" || boxType === "기타") && input.printOption === "무지") {
    return "LOW";
  }

  return "NORMAL";
}

export function getQuoteConfidenceLevel(input: QuoteInput): QuoteConfidenceLevel {
  const boxType = normalizeText(input.boxType);
  const quantityRange = normalizeText(input.quantityRange);

  if (!boxType || !quantityRange || boxType === "아직 모르겠음" || quantityRange === "아직 미정") {
    return "LOW";
  }

  const missingFields = getMissingQuoteFields(input);
  return missingFields.length === 0 ? "HIGH" : "MEDIUM";
}

function getSizeMultiplier(sizeCategory: QuoteSizeCategory, rule: QuoteRuleConfig): number {
  switch (sizeCategory) {
    case "SMALL":
      return rule.smallSizeMultiplier;
    case "MEDIUM":
    case "UNKNOWN":
      return rule.mediumSizeMultiplier;
    case "LARGE":
      return rule.largeSizeMultiplier;
    case "EXTRA_LARGE":
      return rule.extraLargeSizeMultiplier;
  }
}

function getPrintMultiplier(input: QuoteInput, rule: QuoteRuleConfig): number {
  switch (input.printOption) {
    case "무지":
      return rule.printNoneMultiplier;
    case "단색 인쇄":
      return rule.printOneColorMultiplier;
    case "4도 인쇄":
      return rule.printFullColorMultiplier;
    case "박/형압 포함":
      return rule.printFoilEmbossMultiplier;
    default:
      return rule.printOneColorMultiplier;
  }
}

function getComplexityMultiplier(level: QuoteComplexityLevel, rule: QuoteRuleConfig): number {
  switch (level) {
    case "LOW":
      return rule.complexityLowMultiplier;
    case "NORMAL":
      return rule.complexityNormalMultiplier;
    case "HIGH":
      return rule.complexityHighMultiplier;
    case "VERY_HIGH":
      return rule.complexityVeryHighMultiplier;
  }
}

export function selectQuoteRule(input: QuoteInput, rules: QuoteRuleConfig[]): QuoteRuleConfig | null {
  const activeRules = rules.filter((rule) => rule.isActive);
  const fallbackRules = activeRules.length ? activeRules : DEFAULT_QUOTE_RULES;
  const boxType = normalizeText(input.boxType);
  const quantityRange = normalizeText(input.quantityRange);

  return (
    fallbackRules.find((rule) => rule.boxType === boxType && rule.quantityRange === quantityRange) ??
    fallbackRules.find((rule) => rule.boxType === boxType && rule.quantityRange === "아직 미정") ??
    fallbackRules.find((rule) => rule.boxType === "아직 모르겠음" && rule.quantityRange === quantityRange) ??
    fallbackRules.find((rule) => rule.boxType === "아직 모르겠음" && rule.quantityRange === "아직 미정") ??
    fallbackRules[0] ??
    null
  );
}

function createFallbackResult(input: QuoteInput, rule: QuoteRuleConfig | null): ReferenceQuoteResult {
  return {
    estimatedUnitPriceMinKrw: null,
    estimatedUnitPriceMaxKrw: null,
    estimatedTotalPriceMinKrw: null,
    estimatedTotalPriceMaxKrw: null,
    estimateLabel: "상담 후 사양에 맞춰 안내",
    estimateDisclaimer: getQuoteDisclaimer(),
    complexityLevel: calculateComplexityLevel(input),
    confidenceLevel: getQuoteConfidenceLevel(input),
    sizeCategory: calculateSizeCategory(input, rule),
    calculationNotes: ["박스 종류와 제작 수량이 확정되면 참고용 예상 범위를 더 정확하게 계산할 수 있습니다."],
    missingFields: getMissingQuoteFields(input),
    appliedRuleName: rule?.name ?? null,
    appliedRuleId: rule?.id ?? null
  };
}

export function calculateReferenceQuote(input: QuoteInput, rules: QuoteRuleConfig[] = DEFAULT_QUOTE_RULES): ReferenceQuoteResult {
  const rule = selectQuoteRule(input, rules);
  const missingFields = getMissingQuoteFields(input);
  const boxType = normalizeText(input.boxType);
  const quantity = normalizeQuantityRange(input);

  if (!rule || !boxType || boxType === "아직 모르겠음" || !quantity.quantityRange) {
    return createFallbackResult(input, rule);
  }

  const sizeCategory = calculateSizeCategory(input, rule);
  const complexityLevel = calculateComplexityLevel(input);
  const confidenceLevel = getQuoteConfidenceLevel(input);
  const sizeMultiplier = getSizeMultiplier(sizeCategory, rule);
  const printMultiplier = getPrintMultiplier(input, rule);
  const complexityMultiplier = getComplexityMultiplier(complexityLevel, rule);
  const finishingCount = input.finishingOptions?.length ?? 0;
  const finishingMin = finishingCount * rule.finishingBaseAddMinKrw;
  const finishingMax = finishingCount * rule.finishingBaseAddMaxKrw;

  const estimatedUnitPriceMinKrw = roundToHundred(
    rule.baseUnitPriceMinKrw * sizeMultiplier * printMultiplier * complexityMultiplier + finishingMin
  );
  const estimatedUnitPriceMaxKrw = roundToHundred(
    rule.baseUnitPriceMaxKrw * sizeMultiplier * printMultiplier * complexityMultiplier + finishingMax
  );

  let estimatedTotalPriceMinKrw: number | null = null;
  let estimatedTotalPriceMaxKrw: number | null = null;

  if (quantity.representativeQuantity) {
    estimatedTotalPriceMinKrw = estimatedUnitPriceMinKrw * quantity.representativeQuantity;
    estimatedTotalPriceMaxKrw = estimatedUnitPriceMaxKrw * quantity.representativeQuantity;

    if (rule.minOrderPriceKrw > 0 && estimatedTotalPriceMinKrw < rule.minOrderPriceKrw) {
      estimatedTotalPriceMinKrw = rule.minOrderPriceKrw;
      estimatedTotalPriceMaxKrw = Math.max(estimatedTotalPriceMaxKrw, rule.minOrderPriceKrw);
    }
  }

  const result: ReferenceQuoteResult = {
    estimatedUnitPriceMinKrw,
    estimatedUnitPriceMaxKrw,
    estimatedTotalPriceMinKrw,
    estimatedTotalPriceMaxKrw,
    estimateLabel: formatReferenceQuoteRange({
      estimatedUnitPriceMinKrw,
      estimatedUnitPriceMaxKrw,
      estimatedTotalPriceMinKrw,
      estimatedTotalPriceMaxKrw
    }),
    estimateDisclaimer: getQuoteDisclaimer(),
    complexityLevel,
    confidenceLevel,
    sizeCategory,
    calculationNotes: [
      `적용 룰: ${rule.name}`,
      `사이즈 구분: ${QUOTE_SIZE_LABELS[sizeCategory]}`,
      `난이도: ${QUOTE_COMPLEXITY_LABELS[complexityLevel]}`,
      quantity.representativeQuantity
        ? `총 예상 범위는 ${quantity.representativeQuantity.toLocaleString("ko-KR")}개 기준으로 계산했습니다.`
        : "제작 수량이 미정이라 총 예상 범위는 표시하지 않았습니다.",
      rule.minOrderPriceKrw > 0 ? `최소 주문 기준 금액 ${formatKrw(rule.minOrderPriceKrw)}을 참고했습니다.` : "",
      rule.notes ?? ""
    ].filter(Boolean),
    missingFields,
    appliedRuleName: rule.name,
    appliedRuleId: rule.id ?? null
  };

  return result;
}

export function formatReferenceQuoteRange(
  result: Pick<
    ReferenceQuoteResult,
    | "estimatedUnitPriceMinKrw"
    | "estimatedUnitPriceMaxKrw"
    | "estimatedTotalPriceMinKrw"
    | "estimatedTotalPriceMaxKrw"
  >
): string {
  if (!result.estimatedUnitPriceMinKrw || !result.estimatedUnitPriceMaxKrw) {
    return "상담 후 사양에 맞춰 안내";
  }

  const unitRange = `개당 약 ${formatKrw(result.estimatedUnitPriceMinKrw)}~${formatKrw(result.estimatedUnitPriceMaxKrw)}`;

  if (!result.estimatedTotalPriceMinKrw || !result.estimatedTotalPriceMaxKrw) {
    return `${unitRange} 상담 필요`;
  }

  return `${unitRange}, 총 약 ${formatKrw(result.estimatedTotalPriceMinKrw)}~${formatKrw(
    result.estimatedTotalPriceMaxKrw
  )} 상담 필요`;
}

export function toPublicReferenceQuotePreview(result: ReferenceQuoteResult): PublicReferenceQuotePreview {
  const hasUnit = Boolean(result.estimatedUnitPriceMinKrw && result.estimatedUnitPriceMaxKrw);
  const hasTotal = Boolean(result.estimatedTotalPriceMinKrw && result.estimatedTotalPriceMaxKrw);

  return {
    estimateLabel: result.estimateLabel,
    estimateDisclaimer: result.estimateDisclaimer,
    unitPriceRangeLabel: hasUnit
      ? `개당 약 ${formatKrw(result.estimatedUnitPriceMinKrw ?? 0)}~${formatKrw(result.estimatedUnitPriceMaxKrw ?? 0)}`
      : null,
    totalPriceRangeLabel: hasTotal
      ? `총 약 ${formatKrw(result.estimatedTotalPriceMinKrw ?? 0)}~${formatKrw(result.estimatedTotalPriceMaxKrw ?? 0)}`
      : null,
    complexityLabel: QUOTE_COMPLEXITY_LABELS[result.complexityLevel],
    confidenceLabel: QUOTE_CONFIDENCE_LABELS[result.confidenceLevel],
    missingFields: result.missingFields,
    canShowNumericEstimate: hasUnit && result.missingFields.length === 0
  };
}
