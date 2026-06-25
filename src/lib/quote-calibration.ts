export const ESTIMATE_COMPARISON_STATUSES = [
  "IN_RANGE",
  "ABOVE_RANGE",
  "BELOW_RANGE",
  "NO_ESTIMATE",
  "NO_PROPOSAL"
] as const;

export type EstimateComparisonStatus = (typeof ESTIMATE_COMPARISON_STATUSES)[number];

export const ESTIMATE_COMPARISON_STATUS_LABELS: Record<EstimateComparisonStatus, string> = {
  IN_RANGE: "예상 범위 내",
  ABOVE_RANGE: "예상보다 높음",
  BELOW_RANGE: "예상보다 낮음",
  NO_ESTIMATE: "예상 데이터 없음",
  NO_PROPOSAL: "견적안 없음"
};

export type CalibrationLead = {
  id?: string;
  customerName?: string | null;
  companyName?: string | null;
  boxType?: string | null;
  quantityRange?: string | null;
  estimatedTotalPriceMinKrw?: number | null;
  estimatedTotalPriceMaxKrw?: number | null;
};

export type CalibrationProposal = {
  id?: string;
  proposalNumber?: string | null;
  totalAmountKrw?: number | null;
  boxType?: string | null;
  quantityLabel?: string | null;
  lead?: CalibrationLead | null;
};

export function getEstimateComparisonStatus(
  lead: CalibrationLead | null | undefined,
  proposal: CalibrationProposal | null | undefined
): EstimateComparisonStatus {
  const total = proposal?.totalAmountKrw;
  if (!total || total <= 0) return "NO_PROPOSAL";
  const min = lead?.estimatedTotalPriceMinKrw;
  const max = lead?.estimatedTotalPriceMaxKrw;
  if (!min || !max) return "NO_ESTIMATE";
  if (total < min) return "BELOW_RANGE";
  if (total > max) return "ABOVE_RANGE";
  return "IN_RANGE";
}

export function calculateEstimateGapPercent(
  lead: CalibrationLead | null | undefined,
  proposal: CalibrationProposal | null | undefined
): number | null {
  const status = getEstimateComparisonStatus(lead, proposal);
  const total = proposal?.totalAmountKrw;
  const min = lead?.estimatedTotalPriceMinKrw;
  const max = lead?.estimatedTotalPriceMaxKrw;

  if (!total || !min || !max) return null;
  if (status === "IN_RANGE") return 0;
  if (status === "ABOVE_RANGE") return Math.round(((total - max) / max) * 1000) / 10;
  if (status === "BELOW_RANGE") return Math.round(((total - min) / min) * 1000) / 10;
  return null;
}

export function compareEstimateToProposal(lead: CalibrationLead | null | undefined, proposal: CalibrationProposal) {
  return {
    status: getEstimateComparisonStatus(lead, proposal),
    gapPercent: calculateEstimateGapPercent(lead, proposal)
  };
}

function groupCalibration(
  proposals: CalibrationProposal[],
  getKey: (proposal: CalibrationProposal) => string
) {
  const groups = new Map<string, CalibrationProposal[]>();

  proposals.forEach((proposal) => {
    const key = getKey(proposal);
    const current = groups.get(key) ?? [];
    current.push(proposal);
    groups.set(key, current);
  });

  return Array.from(groups.entries()).map(([label, rows]) => {
    const statuses = rows.map((proposal) => getEstimateComparisonStatus(proposal.lead, proposal));

    return {
      label,
      total: rows.length,
      inRange: statuses.filter((status) => status === "IN_RANGE").length,
      aboveRange: statuses.filter((status) => status === "ABOVE_RANGE").length,
      belowRange: statuses.filter((status) => status === "BELOW_RANGE").length,
      noEstimate: statuses.filter((status) => status === "NO_ESTIMATE").length
    };
  });
}

export function groupCalibrationByBoxType(proposals: CalibrationProposal[]) {
  return groupCalibration(proposals, (proposal) => proposal.boxType?.trim() || proposal.lead?.boxType?.trim() || "-");
}

export function groupCalibrationByQuantityRange(proposals: CalibrationProposal[]) {
  return groupCalibration(
    proposals,
    (proposal) => proposal.quantityLabel?.trim() || proposal.lead?.quantityRange?.trim() || "-"
  );
}

export function getCalibrationSummary(proposals: CalibrationProposal[]) {
  const comparisons = proposals.map((proposal) => compareEstimateToProposal(proposal.lead, proposal));
  const gapValues = comparisons
    .map((comparison) => comparison.gapPercent)
    .filter((value): value is number => value !== null);

  return {
    total: proposals.length,
    inRange: comparisons.filter((comparison) => comparison.status === "IN_RANGE").length,
    aboveRange: comparisons.filter((comparison) => comparison.status === "ABOVE_RANGE").length,
    belowRange: comparisons.filter((comparison) => comparison.status === "BELOW_RANGE").length,
    noEstimate: comparisons.filter((comparison) => comparison.status === "NO_ESTIMATE").length,
    averageGapPercent:
      gapValues.length > 0 ? Math.round((gapValues.reduce((sum, value) => sum + value, 0) / gapValues.length) * 10) / 10 : 0
  };
}
