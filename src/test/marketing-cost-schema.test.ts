import { describe, expect, it } from "vitest";
import { marketingCostSchema, toMarketingCostDate } from "@/lib/marketing-cost-schema";

describe("marketingCostSchema", () => {
  it("accepts a valid manual marketing cost record", () => {
    const result = marketingCostSchema.safeParse({
      costDate: "2026-06-20",
      channel: "네이버 검색광고",
      utmSource: "naver",
      utmMedium: "cpc",
      utmCampaign: "premium-box",
      amountKrw: "500000",
      memo: "6월 검색광고 일부"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amountKrw).toBe(500000);
      expect(result.data.utmSource).toBe("naver");
    }
  });

  it("rejects negative costs", () => {
    const result = marketingCostSchema.safeParse({
      costDate: "2026-06-20",
      channel: "구글",
      amountKrw: -1
    });

    expect(result.success).toBe(false);
  });

  it("converts date input into a Date object for persistence", () => {
    const date = toMarketingCostDate("2026-06-20");

    expect(date).toBeInstanceOf(Date);
    expect(Number.isNaN(date.getTime())).toBe(false);
    expect(date.getFullYear()).toBe(2026);
  });
});
