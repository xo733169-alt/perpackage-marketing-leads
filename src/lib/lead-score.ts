export type LeadScoreInput = {
  phone?: string | null;
  companyName?: string | null;
  quantityRange?: string | null;
  desiredDeliveryDate?: string | Date | null;
  referenceNote?: string | null;
  budgetRange?: string | null;
  boxType?: string | null;
};

function hasValue(value: unknown): boolean {
  return typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;
}

export function calculateLeadScore(input: LeadScoreInput): number {
  let score = 0;

  if (hasValue(input.phone)) score += 10;
  if (hasValue(input.companyName)) score += 10;
  if (input.quantityRange === "500~1000개") score += 20;
  if (input.quantityRange === "1000개 이상") score += 30;
  if (hasValue(input.desiredDeliveryDate)) score += 10;
  if (hasValue(input.referenceNote)) score += 10;
  if (input.budgetRange === "300~500만원") score += 20;
  if (input.budgetRange === "500만원 이상") score += 20;
  if (input.boxType === "아직 모르겠음") score -= 5;
  if (input.quantityRange === "아직 미정") score -= 10;

  return score;
}
