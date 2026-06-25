import { describe, expect, it } from "vitest";
import {
  buildLeadUpdateForProposalStatus,
  calculateProposalTotals,
  getMidpointUnitPrice,
  getRepresentativeQuantityFromRange
} from "@/lib/quote-proposal";

describe("quote proposal helpers", () => {
  it("calculates proposal item amounts and totals server-side", () => {
    const result = calculateProposalTotals([
      { itemName: "싸바리박스 제작", quantity: 400, unitPriceKrw: 5000 },
      { itemName: "금박 추가", quantity: 400, unitPriceKrw: 300 }
    ]);

    expect(result.items[0].amountKrw).toBe(2_000_000);
    expect(result.subtotalAmountKrw).toBe(2_120_000);
    expect(result.vatAmountKrw).toBe(212_000);
    expect(result.totalAmountKrw).toBe(2_332_000);
  });

  it("gets representative quantity and midpoint price", () => {
    expect(getRepresentativeQuantityFromRange("300~500개")).toBe(400);
    expect(getRepresentativeQuantityFromRange("아직 미정")).toBeNull();
    expect(getMidpointUnitPrice(3000, 6000)).toBe(4500);
    expect(getMidpointUnitPrice(null, null)).toBe(0);
  });

  it("builds lead updates when proposal is sent or accepted", () => {
    const now = new Date("2026-06-20T10:00:00");

    expect(
      buildLeadUpdateForProposalStatus({
        currentStatus: "CONTACTING",
        quotedAt: null,
        proposalStatus: "SENT",
        proposalTotalAmountKrw: 2_000_000,
        now
      })
    ).toEqual({ status: "QUOTED", quotedAt: now });

    expect(
      buildLeadUpdateForProposalStatus({
        currentStatus: "QUOTED",
        orderConfirmedAt: null,
        confirmedOrderAmountKrw: null,
        proposalStatus: "ACCEPTED",
        proposalTotalAmountKrw: 2_000_000,
        now
      })
    ).toEqual({ status: "ORDER_CONFIRMED", orderConfirmedAt: now, confirmedOrderAmountKrw: 2_000_000 });
  });
});
