import { describe, expect, it } from "vitest";
import { calculateLeadScore } from "@/lib/lead-score";

describe("calculateLeadScore", () => {
  it("adds points for contact, company, high quantity, delivery date, reference and budget", () => {
    expect(
      calculateLeadScore({
        phone: "010-1234-5678",
        companyName: "페르패키지",
        quantityRange: "1000개 이상",
        desiredDeliveryDate: "2026-07-01",
        referenceNote: "참고 링크",
        budgetRange: "500만원 이상",
        boxType: "싸바리박스"
      })
    ).toBe(90);
  });

  it("subtracts points when structure or quantity is undecided", () => {
    expect(
      calculateLeadScore({
        phone: "010-1234-5678",
        quantityRange: "아직 미정",
        boxType: "아직 모르겠음"
      })
    ).toBe(-5);
  });
});
