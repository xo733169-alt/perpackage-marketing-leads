import { describe, expect, it } from "vitest";
import {
  buildRevisionDraftFromProposal,
  buildSupersededProposalUpdate,
  compareProposalItems,
  compareProposalTotals,
  createRevisionTitle,
  getNextRevisionNumber
} from "@/lib/quote-proposal-revision";
import { getRevisionReasonFromCustomerResponse, quoteProposalRevisionSchema } from "@/lib/quote-proposal-revision-schema";

describe("quote proposal revision helpers", () => {
  it("calculates the next revision number", () => {
    expect(getNextRevisionNumber([])).toBe(1);
    expect(getNextRevisionNumber([{ revisionNumber: 1 }, { revisionNumber: 3 }])).toBe(4);
  });

  it("creates clean revision titles", () => {
    expect(createRevisionTitle("화장품 자석박스 견적안", 2)).toBe("화장품 자석박스 견적안 (수정 2차)");
    expect(createRevisionTitle("화장품 자석박스 견적안 (수정 2차)", 3)).toBe("화장품 자석박스 견적안 (수정 3차)");
  });

  it("builds a revision draft without mutating the previous proposal", () => {
    const draft = buildRevisionDraftFromProposal(
      {
        id: "proposal-1",
        title: "선물세트 싸바리박스 견적안",
        revisionNumber: 1,
        revisionGroupId: null
      },
      "수량 변경"
    );

    expect(draft).toMatchObject({
      revisionGroupId: "proposal-1",
      revisionNumber: 2,
      parentProposalId: "proposal-1",
      status: "DRAFT",
      revisionReason: "수량 변경"
    });
  });

  it("detects item and total differences", () => {
    const itemComparisons = compareProposalItems(
      [{ itemName: "박스 제작", quantity: 500, unitPriceKrw: 3000, amountKrw: 1_500_000 }],
      [
        { itemName: "박스 제작", quantity: 700, unitPriceKrw: 3200, amountKrw: 2_240_000 },
        { itemName: "금박 추가", quantity: 700, unitPriceKrw: 300, amountKrw: 210_000 }
      ]
    );

    expect(itemComparisons[0].statuses).toEqual(["QUANTITY_CHANGED", "UNIT_PRICE_CHANGED", "AMOUNT_CHANGED"]);
    expect(itemComparisons[1].statuses).toEqual(["ADDED"]);

    const totals = compareProposalTotals(
      { id: "p1", title: "old", totalAmountKrw: 1_650_000, subtotalAmountKrw: 1_500_000, vatAmountKrw: 150_000 },
      { id: "p2", title: "new", totalAmountKrw: 2_695_000, subtotalAmountKrw: 2_450_000, vatAmountKrw: 245_000 }
    );

    expect(totals.totalDifference).toBe(1_045_000);
    expect(totals.totalDifferencePercent).toBeCloseTo(63.33, 1);
  });

  it("marks eligible previous proposals as superseded", () => {
    const now = new Date("2026-06-20T10:00:00");

    expect(buildSupersededProposalUpdate("SENT", "proposal-2", now)).toEqual({
      isLatestRevision: false,
      supersededByProposalId: "proposal-2",
      supersededAt: now,
      status: "SUPERSEDED"
    });
    expect(buildSupersededProposalUpdate("ACCEPTED", "proposal-2", now).status).toBe("ACCEPTED");
  });

  it("validates revision reason and falls back to customer response", () => {
    expect(quoteProposalRevisionSchema.safeParse({ revisionReason: "수량 변경" }).success).toBe(true);
    expect(getRevisionReasonFromCustomerResponse("", "금박 제외 요청")).toBe("금박 제외 요청");
  });
});
