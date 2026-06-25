import type { Lead, Prisma, QuoteProposalItem } from "@prisma/client";
import { parseFinishingOptions } from "./admin-leads";
import { getEstimateComparisonStatus } from "./quote-calibration";
import type { QuoteProposalInput, QuoteProposalItemInput, QuoteProposalStatus } from "./quote-proposal-schema";

export type ProposalItemForCalculation = Pick<QuoteProposalItemInput, "itemName" | "description" | "quantity" | "unitPriceKrw"> & {
  sortOrder?: number;
};

export function getRepresentativeQuantityFromRange(quantityRange: string | null | undefined): number | null {
  switch (quantityRange) {
    case "100개 이하":
      return 100;
    case "100~300개":
      return 200;
    case "300~500개":
      return 400;
    case "500~1000개":
      return 750;
    case "1000개 이상":
      return 1000;
    default:
      return null;
  }
}

export function getMidpointUnitPrice(min: number | null | undefined, max: number | null | undefined): number {
  if (min && max) return Math.round((min + max) / 2);
  if (min) return min;
  if (max) return max;
  return 0;
}

export function calculateProposalTotals(items: ProposalItemForCalculation[]) {
  const normalizedItems = items.map((item, index) => {
    const quantity = Math.max(1, Number(item.quantity) || 1);
    const unitPriceKrw = Math.max(0, Number(item.unitPriceKrw) || 0);
    const amountKrw = quantity * unitPriceKrw;

    return {
      sortOrder: item.sortOrder ?? index,
      itemName: item.itemName,
      description: item.description ?? null,
      quantity,
      unitPriceKrw,
      amountKrw
    };
  });

  const subtotalAmountKrw = normalizedItems.reduce((sum, item) => sum + item.amountKrw, 0);
  const vatAmountKrw = Math.round(subtotalAmountKrw * 0.1);
  const totalAmountKrw = subtotalAmountKrw + vatAmountKrw;

  return {
    items: normalizedItems,
    subtotalAmountKrw,
    vatAmountKrw,
    totalAmountKrw
  };
}

export function buildSpecificationSummaryFromLead(lead: Lead): string {
  const size = [lead.widthMm, lead.depthMm, lead.heightMm].every(Boolean)
    ? `${lead.widthMm} x ${lead.depthMm} x ${lead.heightMm}mm`
    : "사이즈 미정";
  const finishingOptions = parseFinishingOptions(lead.finishingOptions);

  return [
    `박스 종류: ${lead.boxType}`,
    `업종: ${lead.industry}`,
    `수량: ${lead.quantityRange}`,
    `사이즈: ${size}`,
    `인쇄: ${lead.printOption}`,
    finishingOptions.length ? `후가공: ${finishingOptions.join(", ")}` : "후가공: 미정 또는 없음",
    lead.referenceNote ? `참고: ${lead.referenceNote}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildDefaultProposalItemFromLead(lead: Lead): ProposalItemForCalculation {
  const quantity = getRepresentativeQuantityFromRange(lead.quantityRange) ?? 1;
  const unitPriceKrw = getMidpointUnitPrice(lead.estimatedUnitPriceMinKrw, lead.estimatedUnitPriceMaxKrw);

  return {
    sortOrder: 0,
    itemName: `${lead.boxType} 제작`,
    description: buildSpecificationSummaryFromLead(lead),
    quantity,
    unitPriceKrw
  };
}

export function buildQuoteProposalCreateData(input: QuoteProposalInput, proposalNumber: string) {
  const totals = calculateProposalTotals(input.items);
  const estimateComparisonStatus = getEstimateComparisonStatus(
    {
      estimatedTotalPriceMinKrw: input.basedOnTotalPriceMinKrw ?? null,
      estimatedTotalPriceMaxKrw: input.basedOnTotalPriceMaxKrw ?? null
    },
    { totalAmountKrw: totals.totalAmountKrw }
  );

  return {
    proposal: {
      leadId: input.leadId ?? null,
      proposalNumber,
      status: input.status,
      title: input.title,
      customerNameSnapshot: input.customerNameSnapshot,
      companyNameSnapshot: input.companyNameSnapshot ?? null,
      phoneSnapshot: input.phoneSnapshot ?? null,
      emailSnapshot: input.emailSnapshot ?? null,
      kakaoIdSnapshot: input.kakaoIdSnapshot ?? null,
      boxType: input.boxType,
      industry: input.industry,
      quantityLabel: input.quantityLabel ?? null,
      quantityCount: input.quantityCount ?? null,
      specificationSummary: input.specificationSummary ?? null,
      productionNotes: input.productionNotes ?? null,
      deliveryEstimateText: input.deliveryEstimateText ?? null,
      paymentTerms: input.paymentTerms ?? null,
      validUntil: input.validUntil ?? null,
      subtotalAmountKrw: totals.subtotalAmountKrw,
      vatAmountKrw: totals.vatAmountKrw,
      totalAmountKrw: totals.totalAmountKrw,
      vatIncluded: input.vatIncluded,
      customerMessage: input.customerMessage ?? null,
      internalMemo: input.internalMemo ?? null,
      basedOnEstimateLabel: input.basedOnEstimateLabel ?? null,
      basedOnUnitPriceMinKrw: input.basedOnUnitPriceMinKrw ?? null,
      basedOnUnitPriceMaxKrw: input.basedOnUnitPriceMaxKrw ?? null,
      basedOnTotalPriceMinKrw: input.basedOnTotalPriceMinKrw ?? null,
      basedOnTotalPriceMaxKrw: input.basedOnTotalPriceMaxKrw ?? null,
      estimateComparisonStatus
    } satisfies Prisma.QuoteProposalUncheckedCreateInput,
    items: totals.items
  };
}

export function buildQuoteProposalUpdateData(input: QuoteProposalInput) {
  const totals = calculateProposalTotals(input.items);
  const estimateComparisonStatus = getEstimateComparisonStatus(
    {
      estimatedTotalPriceMinKrw: input.basedOnTotalPriceMinKrw ?? null,
      estimatedTotalPriceMaxKrw: input.basedOnTotalPriceMaxKrw ?? null
    },
    { totalAmountKrw: totals.totalAmountKrw }
  );

  return {
    proposal: {
      leadId: input.leadId ?? null,
      status: input.status,
      title: input.title,
      customerNameSnapshot: input.customerNameSnapshot,
      companyNameSnapshot: input.companyNameSnapshot ?? null,
      phoneSnapshot: input.phoneSnapshot ?? null,
      emailSnapshot: input.emailSnapshot ?? null,
      kakaoIdSnapshot: input.kakaoIdSnapshot ?? null,
      boxType: input.boxType,
      industry: input.industry,
      quantityLabel: input.quantityLabel ?? null,
      quantityCount: input.quantityCount ?? null,
      specificationSummary: input.specificationSummary ?? null,
      productionNotes: input.productionNotes ?? null,
      deliveryEstimateText: input.deliveryEstimateText ?? null,
      paymentTerms: input.paymentTerms ?? null,
      validUntil: input.validUntil ?? null,
      subtotalAmountKrw: totals.subtotalAmountKrw,
      vatAmountKrw: totals.vatAmountKrw,
      totalAmountKrw: totals.totalAmountKrw,
      vatIncluded: input.vatIncluded,
      customerMessage: input.customerMessage ?? null,
      internalMemo: input.internalMemo ?? null,
      basedOnEstimateLabel: input.basedOnEstimateLabel ?? null,
      basedOnUnitPriceMinKrw: input.basedOnUnitPriceMinKrw ?? null,
      basedOnUnitPriceMaxKrw: input.basedOnUnitPriceMaxKrw ?? null,
      basedOnTotalPriceMinKrw: input.basedOnTotalPriceMinKrw ?? null,
      basedOnTotalPriceMaxKrw: input.basedOnTotalPriceMaxKrw ?? null,
      estimateComparisonStatus
    } satisfies Prisma.QuoteProposalUncheckedUpdateInput,
    items: totals.items
  };
}

export function buildLeadUpdateForProposalStatus({
  currentStatus,
  quotedAt,
  orderConfirmedAt,
  confirmedOrderAmountKrw,
  proposalStatus,
  proposalTotalAmountKrw,
  now = new Date()
}: {
  currentStatus: string;
  quotedAt?: Date | null;
  orderConfirmedAt?: Date | null;
  confirmedOrderAmountKrw?: number | null;
  proposalStatus: QuoteProposalStatus;
  proposalTotalAmountKrw: number;
  now?: Date;
}): Prisma.LeadUncheckedUpdateInput | null {
  if (proposalStatus === "SENT") {
    return {
      status: currentStatus === "NEW" || currentStatus === "CONTACTING" ? "QUOTED" : currentStatus,
      quotedAt: quotedAt ?? now
    };
  }

  if (proposalStatus === "ACCEPTED") {
    return {
      status: "ORDER_CONFIRMED",
      orderConfirmedAt: orderConfirmedAt ?? now,
      confirmedOrderAmountKrw: confirmedOrderAmountKrw ?? proposalTotalAmountKrw
    };
  }

  return null;
}
