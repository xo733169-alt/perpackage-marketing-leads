import {
  QUOTE_PROPOSAL_STATUS_LABELS,
  type QuoteProposalStatus
} from "./quote-proposal-schema";

export type RevisionProposalLike = {
  id: string;
  proposalNumber?: string;
  title: string;
  status?: string;
  revisionGroupId?: string | null;
  revisionNumber?: number | null;
  subtotalAmountKrw?: number | null;
  vatAmountKrw?: number | null;
  totalAmountKrw?: number | null;
  specificationSummary?: string | null;
  productionNotes?: string | null;
  deliveryEstimateText?: string | null;
  paymentTerms?: string | null;
  customerMessage?: string | null;
};

export type RevisionItemLike = {
  id?: string;
  sortOrder?: number | null;
  itemName: string;
  description?: string | null;
  quantity: number;
  unitPriceKrw: number;
  amountKrw: number;
};

export type RevisionComparisonStatus =
  | "ADDED"
  | "REMOVED"
  | "QUANTITY_CHANGED"
  | "UNIT_PRICE_CHANGED"
  | "AMOUNT_CHANGED"
  | "UNCHANGED";

export const REVISION_COMPARISON_LABELS: Record<RevisionComparisonStatus, string> = {
  ADDED: "추가됨",
  REMOVED: "삭제됨",
  QUANTITY_CHANGED: "수량 변경",
  UNIT_PRICE_CHANGED: "단가 변경",
  AMOUNT_CHANGED: "금액 변경",
  UNCHANGED: "변경 없음"
};

export type RevisionItemComparison = {
  key: string;
  previousItem: RevisionItemLike | null;
  currentItem: RevisionItemLike | null;
  statuses: RevisionComparisonStatus[];
};

export function getNextRevisionNumber(existingRevisions: Array<{ revisionNumber?: number | null }>): number {
  if (existingRevisions.length === 0) return 1;
  return Math.max(...existingRevisions.map((revision) => revision.revisionNumber ?? 1)) + 1;
}

export function createRevisionTitle(previousTitle: string, nextRevisionNumber: number): string {
  const cleanTitle = previousTitle.replace(/\s*\(수정 \d+차\)\s*$/, "").trim();
  return `${cleanTitle} (수정 ${nextRevisionNumber}차)`;
}

export function buildRevisionDraftFromProposal(
  previousProposal: RevisionProposalLike,
  reason: string | null | undefined,
  nextRevisionNumber = (previousProposal.revisionNumber ?? 1) + 1
) {
  return {
    revisionGroupId: previousProposal.revisionGroupId ?? previousProposal.id,
    revisionNumber: nextRevisionNumber,
    parentProposalId: previousProposal.id,
    isLatestRevision: true,
    revisionReason: reason?.trim() || null,
    title: createRevisionTitle(previousProposal.title, nextRevisionNumber),
    status: "DRAFT" as QuoteProposalStatus
  };
}

export function buildSupersededProposalUpdate(
  currentStatus: string,
  supersededByProposalId: string,
  now = new Date()
) {
  return {
    isLatestRevision: false,
    supersededByProposalId,
    supersededAt: now,
    status: currentStatus === "ACCEPTED" || currentStatus === "CANCELLED" ? currentStatus : "SUPERSEDED"
  };
}

function sortItems(items: RevisionItemLike[]) {
  return [...items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function getItemComparisonKey(item: RevisionItemLike | null, index: number) {
  return item?.id ?? `${item?.itemName ?? "item"}-${index}`;
}

export function compareProposalItems(
  previousItems: RevisionItemLike[],
  currentItems: RevisionItemLike[]
): RevisionItemComparison[] {
  const previous = sortItems(previousItems);
  const current = sortItems(currentItems);
  const maxLength = Math.max(previous.length, current.length);
  const comparisons: RevisionItemComparison[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const previousItem = previous[index] ?? null;
    const currentItem = current[index] ?? null;

    if (!previousItem && currentItem) {
      comparisons.push({
        key: getItemComparisonKey(currentItem, index),
        previousItem,
        currentItem,
        statuses: ["ADDED"]
      });
      continue;
    }

    if (previousItem && !currentItem) {
      comparisons.push({
        key: getItemComparisonKey(previousItem, index),
        previousItem,
        currentItem,
        statuses: ["REMOVED"]
      });
      continue;
    }

    if (!previousItem || !currentItem) continue;

    const statuses: RevisionComparisonStatus[] = [];
    if (previousItem.quantity !== currentItem.quantity) statuses.push("QUANTITY_CHANGED");
    if (previousItem.unitPriceKrw !== currentItem.unitPriceKrw) statuses.push("UNIT_PRICE_CHANGED");
    if (previousItem.amountKrw !== currentItem.amountKrw) statuses.push("AMOUNT_CHANGED");
    if (statuses.length === 0) statuses.push("UNCHANGED");

    comparisons.push({
      key: getItemComparisonKey(currentItem, index),
      previousItem,
      currentItem,
      statuses
    });
  }

  return comparisons;
}

export function compareProposalTotals(previousProposal: RevisionProposalLike, currentProposal: RevisionProposalLike) {
  const previousSubtotal = previousProposal.subtotalAmountKrw ?? 0;
  const currentSubtotal = currentProposal.subtotalAmountKrw ?? 0;
  const previousVat = previousProposal.vatAmountKrw ?? 0;
  const currentVat = currentProposal.vatAmountKrw ?? 0;
  const previousTotal = previousProposal.totalAmountKrw ?? 0;
  const currentTotal = currentProposal.totalAmountKrw ?? 0;
  const totalDifference = currentTotal - previousTotal;
  const totalDifferencePercent = previousTotal > 0 ? (totalDifference / previousTotal) * 100 : null;

  return {
    previousSubtotal,
    currentSubtotal,
    subtotalDifference: currentSubtotal - previousSubtotal,
    previousVat,
    currentVat,
    vatDifference: currentVat - previousVat,
    previousTotal,
    currentTotal,
    totalDifference,
    totalDifferencePercent
  };
}

export function getRevisionStatusLabel(status: string): string {
  return QUOTE_PROPOSAL_STATUS_LABELS[status as QuoteProposalStatus] ?? status;
}

export function getRevisionSummary(previousProposal: RevisionProposalLike, currentProposal: RevisionProposalLike) {
  const totals = compareProposalTotals(previousProposal, currentProposal);
  const previousRevision = previousProposal.revisionNumber ?? 1;
  const currentRevision = currentProposal.revisionNumber ?? previousRevision + 1;

  return {
    previousRevision,
    currentRevision,
    title: `${previousProposal.proposalNumber ?? "이전 견적안"} → ${currentProposal.proposalNumber ?? "현재 견적안"}`,
    totalDifference: totals.totalDifference,
    totalDifferencePercent: totals.totalDifferencePercent
  };
}
