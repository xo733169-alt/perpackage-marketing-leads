import { describe, expect, it } from "vitest";
import { ESTIMATE_EMPTY_MESSAGE, ESTIMATE_NOTICE, getEstimatePreview, getEstimatedPriceRange } from "@/lib/estimate";

describe("getEstimatedPriceRange", () => {
  it("returns the rigid box reference range for 300 to 500 units", () => {
    const result = getEstimatedPriceRange({
      boxType: "싸바리박스",
      quantityRange: "300~500개"
    });

    expect(result).toContain("개당 약");
    expect(result).toContain("상담 필요");
    expect(result).toContain(ESTIMATE_NOTICE);
  });

  it("does not present undecided box type as a confirmed quote", () => {
    const result = getEstimatedPriceRange({
      boxType: "아직 모르겠음",
      quantityRange: "1000개 이상"
    });

    expect(result).toContain("상담 후 사양에 맞춰 안내");
    expect(result).toContain("최종 견적은 종이, 구조, 인쇄, 후가공, 수량, 제작 난이도 확인 후 상담을 통해 안내드립니다");
  });
});

describe("getEstimatePreview", () => {
  it("asks for box type and quantity before showing a reference estimate", () => {
    expect(getEstimatePreview({ boxType: "싸바리박스" })).toBe(ESTIMATE_EMPTY_MESSAGE);
  });
});
