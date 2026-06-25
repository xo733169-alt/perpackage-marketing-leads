import { describe, expect, it } from "vitest";
import { preparePortfolioImportRecord, preparePortfolioImportRecords } from "@/lib/portfolio-import";

const draftRecord = {
  title: "화장품 자석박스 제작 사례",
  slug: "cosmetic-magnetic-box-import-case",
  industry: "화장품",
  boxType: "자석박스",
  shortDescription: "화장품 브랜드용 자석박스 제작 사례입니다."
};

describe("portfolio import helpers", () => {
  it("defaults imported records to draft and unapproved", () => {
    const result = preparePortfolioImportRecord(draftRecord);

    expect(result.status).toBe("DRAFT");
    expect(result.publicApprovalConfirmed).toBe(false);
    expect(result.featured).toBe(false);
  });

  it("accepts an object with cases array", () => {
    const result = preparePortfolioImportRecords({ cases: [draftRecord] });
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("cosmetic-magnetic-box-import-case");
  });

  it("rejects published import records without approval", () => {
    expect(() =>
      preparePortfolioImportRecord({
        ...draftRecord,
        status: "PUBLISHED",
        publicApprovalConfirmed: false
      })
    ).toThrow();
  });
});
