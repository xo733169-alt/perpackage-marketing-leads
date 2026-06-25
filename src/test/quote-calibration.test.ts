import { describe, expect, it } from "vitest";
import {
  calculateEstimateGapPercent,
  getCalibrationSummary,
  getEstimateComparisonStatus,
  groupCalibrationByBoxType,
  groupCalibrationByQuantityRange
} from "@/lib/quote-calibration";

const lead = {
  boxType: "싸바리박스",
  quantityRange: "300~500개",
  estimatedTotalPriceMinKrw: 1_000_000,
  estimatedTotalPriceMaxKrw: 2_000_000
};

describe("quote calibration", () => {
  it("compares proposal total with reference estimate range", () => {
    expect(getEstimateComparisonStatus(lead, { totalAmountKrw: 1_500_000 })).toBe("IN_RANGE");
    expect(getEstimateComparisonStatus(lead, { totalAmountKrw: 2_500_000 })).toBe("ABOVE_RANGE");
    expect(getEstimateComparisonStatus(lead, { totalAmountKrw: 800_000 })).toBe("BELOW_RANGE");
    expect(getEstimateComparisonStatus({}, { totalAmountKrw: 800_000 })).toBe("NO_ESTIMATE");
    expect(getEstimateComparisonStatus(lead, { totalAmountKrw: null })).toBe("NO_PROPOSAL");
  });

  it("calculates signed gap percent outside the range", () => {
    expect(calculateEstimateGapPercent(lead, { totalAmountKrw: 2_500_000 })).toBe(25);
    expect(calculateEstimateGapPercent(lead, { totalAmountKrw: 800_000 })).toBe(-20);
    expect(calculateEstimateGapPercent(lead, { totalAmountKrw: 1_500_000 })).toBe(0);
  });

  it("groups calibration rows by box type and quantity range", () => {
    const proposals = [
      { boxType: "싸바리박스", quantityLabel: "300~500개", totalAmountKrw: 1_500_000, lead },
      { boxType: "싸바리박스", quantityLabel: "300~500개", totalAmountKrw: 2_500_000, lead },
      { boxType: "자석박스", quantityLabel: "100~300개", totalAmountKrw: 900_000, lead: { ...lead, boxType: "자석박스" } }
    ];

    expect(groupCalibrationByBoxType(proposals)).toHaveLength(2);
    expect(groupCalibrationByQuantityRange(proposals)).toHaveLength(2);
    expect(getCalibrationSummary(proposals).aboveRange).toBe(1);
  });
});
