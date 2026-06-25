import { describe, expect, it } from "vitest";
import { quoteProposalSchema } from "@/lib/quote-proposal-schema";

const validProposal = {
  status: "DRAFT",
  title: "홍길동 싸바리박스 견적안",
  customerNameSnapshot: "홍길동",
  boxType: "싸바리박스",
  industry: "화장품",
  vatIncluded: false,
  items: [{ itemName: "싸바리박스 제작", quantity: 400, unitPriceKrw: 5000 }]
};

describe("quoteProposalSchema", () => {
  it("accepts a valid proposal", () => {
    const result = quoteProposalSchema.safeParse(validProposal);

    expect(result.success).toBe(true);
  });

  it("requires title and at least one item", () => {
    const result = quoteProposalSchema.safeParse({
      ...validProposal,
      title: "",
      items: []
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.title?.[0]).toBe("견적안 제목을 입력해 주세요.");
      expect(result.error.flatten().fieldErrors.items?.[0]).toBe("견적 항목을 1개 이상 입력해 주세요.");
    }
  });

  it("rejects invalid item quantity and unit price", () => {
    const result = quoteProposalSchema.safeParse({
      ...validProposal,
      items: [{ itemName: "싸바리박스 제작", quantity: 0, unitPriceKrw: -1 }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.items?.[0]).toBeDefined();
    }
  });
});
