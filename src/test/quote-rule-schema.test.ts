import { describe, expect, it } from "vitest";
import { DEFAULT_QUOTE_RULES } from "@/lib/default-quote-rules";
import { quoteRuleSchema } from "@/lib/quote-rule-schema";

describe("quoteRuleSchema", () => {
  it("accepts a valid quote rule", () => {
    const result = quoteRuleSchema.safeParse(DEFAULT_QUOTE_RULES[0]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toContain("기본");
      expect(result.data.isActive).toBe(true);
    }
  });

  it("requires rule name and box type", () => {
    const result = quoteRuleSchema.safeParse({
      ...DEFAULT_QUOTE_RULES[0],
      name: "",
      boxType: ""
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.name?.[0]).toBe("룰 이름을 입력해 주세요.");
      expect(result.error.flatten().fieldErrors.boxType?.[0]).toBe("박스 종류를 선택해 주세요.");
    }
  });

  it("rejects invalid unit price ranges", () => {
    const result = quoteRuleSchema.safeParse({
      ...DEFAULT_QUOTE_RULES[0],
      baseUnitPriceMinKrw: 9000,
      baseUnitPriceMaxKrw: 1000
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.baseUnitPriceMinKrw?.[0]).toBe(
        "최소 단가는 최대 단가보다 클 수 없습니다."
      );
    }
  });
});
