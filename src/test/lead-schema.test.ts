import { describe, expect, it } from "vitest";
import { leadCreateSchema } from "@/lib/lead-schema";

const validLead = {
  customerName: "홍길동",
  phone: "010-1234-5678",
  industry: "화장품",
  boxType: "싸바리박스",
  quantityRange: "300~500개",
  printOption: "4도 인쇄",
  privacyConsent: true
};

describe("leadCreateSchema", () => {
  it("requires privacy consent", () => {
    const result = leadCreateSchema.safeParse({
      ...validLead,
      privacyConsent: false
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.privacyConsent?.[0]).toBe("개인정보 수집 및 이용에 동의해 주세요.");
    }
  });

  it("accepts optional marketing consent and tracking fields", () => {
    const result = leadCreateSchema.safeParse({
      ...validLead,
      marketingConsent: true,
      utmSource: "naver",
      utmMedium: "search",
      landingPath: "/?utm_source=naver"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.marketingConsent).toBe(true);
      expect(result.data.utmSource).toBe("naver");
    }
  });

  it("accepts portfolio source tracking fields", () => {
    const result = leadCreateSchema.safeParse({
      ...validLead,
      sourceCaseSlug: "cosmetic-rigid-box",
      sourceCaseTitle: "화장품 싸바리박스 제작 사례"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceCaseSlug).toBe("cosmetic-rigid-box");
      expect(result.data.sourceCaseTitle).toBe("화장품 싸바리박스 제작 사례");
    }
  });

  it("accepts optional package structure and readiness fields", () => {
    const result = leadCreateSchema.safeParse({
      ...validLead,
      packageType: "단상자",
      packageStructure: "맞뚜껑",
      quantity: "1000개",
      sizeInfo: "120 x 80 x 40 mm",
      hasPhysicalProduct: "있음",
      hasDesignFile: "없음",
      hasDieline: "모름",
      desiredDueDate: "2주 이내",
      isUrgent: "true",
      budgetRange: "50~100만원",
      finishingOptions: ["무광코팅", "박"],
      readinessChecklist: [{ key: "size", label: "사이즈 확인", checked: true }],
      readinessScore: "60",
      consultationNotes: "구조 상담 필요"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.packageStructure).toBe("맞뚜껑");
      expect(result.data.isUrgent).toBe(true);
      expect(result.data.budgetRange).toBe("50~100만원");
      expect(result.data.finishingOptions).toEqual(["무광코팅", "박"]);
      expect(result.data.readinessScore).toBe(60);
    }
  });

  it("normalizes minimal package inquiry defaults for existing required DB fields", () => {
    const result = leadCreateSchema.safeParse({
      customerName: "홍길동",
      phone: "010-1234-5678",
      message: "패키지 구조 상담을 받고 싶습니다.",
      privacyConsent: true,
      finishingOptions: "무광코팅, 금박",
      readinessChecklist: "{\"size\":true}"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.industry).toBe("기타");
      expect(result.data.boxType).toBe("아직 모르겠음");
      expect(result.data.quantityRange).toBe("아직 미정");
      expect(result.data.printOption).toBe("아직 미정");
      expect(result.data.finishingOptions).toEqual(["무광코팅", "금박"]);
    }
  });
});
