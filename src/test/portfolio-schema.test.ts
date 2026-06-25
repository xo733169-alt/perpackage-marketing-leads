import { describe, expect, it } from "vitest";
import { PORTFOLIO_PURPOSE_OPTIONS, PORTFOLIO_STRUCTURE_OPTIONS } from "@/lib/portfolio-options";
import { portfolioCaseSchema } from "@/lib/portfolio-schema";

const validCase = {
  title: "화장품 자석박스 제작 사례",
  slug: "cosmetic-magnetic-box-case",
  status: "DRAFT",
  featured: false,
  industry: "화장품",
  boxType: "자석박스",
  shortDescription: "화장품 브랜드용 자석박스 제작 사례입니다.",
  publicApprovalConfirmed: false
};

describe("portfolioCaseSchema", () => {
  it("accepts valid portfolio case input", () => {
    const result = portfolioCaseSchema.safeParse({
      ...validCase,
      packageStructure: PORTFOLIO_STRUCTURE_OPTIONS[0],
      casePurpose: PORTFOLIO_PURPOSE_OPTIONS[0],
      finishingOptions: ["무광코팅", "금박"],
      imageUrls: ["https://example.com/case-1.jpg"],
      tags: ["화장품", "자석박스"]
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("DRAFT");
      expect(result.data.packageStructure).toBe(PORTFOLIO_STRUCTURE_OPTIONS[0]);
      expect(result.data.casePurpose).toBe(PORTFOLIO_PURPOSE_OPTIONS[0]);
      expect(result.data.finishingOptions).toEqual(["무광코팅", "금박"]);
    }
  });

  it("treats empty portfolio filter fields as optional", () => {
    const result = portfolioCaseSchema.safeParse({
      ...validCase,
      packageStructure: "",
      casePurpose: ""
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.packageStructure).toBeUndefined();
      expect(result.data.casePurpose).toBeUndefined();
    }
  });

  it("accepts local upload paths and external URLs for the main image", () => {
    const localUpload = portfolioCaseSchema.safeParse({
      ...validCase,
      mainImageUrl: "/uploads/portfolio/portfolio-20260621-test.webp"
    });
    const externalUrl = portfolioCaseSchema.safeParse({
      ...validCase,
      mainImageUrl: "https://example.com/portfolio-image.jpg"
    });
    const emptyUrl = portfolioCaseSchema.safeParse({
      ...validCase,
      mainImageUrl: ""
    });

    expect(localUpload.success).toBe(true);
    expect(externalUrl.success).toBe(true);
    expect(emptyUrl.success).toBe(true);
    if (emptyUrl.success) {
      expect(emptyUrl.data.mainImageUrl).toBeUndefined();
    }
  });

  it("rejects unsafe slugs", () => {
    const result = portfolioCaseSchema.safeParse({
      ...validCase,
      slug: "화장품 자석박스"
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.slug?.[0]).toBe(
        "슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
      );
    }
  });

  it("blocks publish without public approval confirmation", () => {
    const result = portfolioCaseSchema.safeParse({
      ...validCase,
      status: "PUBLISHED",
      publicApprovalConfirmed: false
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.publicApprovalConfirmed?.[0]).toBe(
        "제작 사례를 공개하려면 공개 승인 확인이 필요합니다."
      );
    }
  });

  it("allows publish when public approval is confirmed", () => {
    const result = portfolioCaseSchema.safeParse({
      ...validCase,
      status: "PUBLISHED",
      publicApprovalConfirmed: true,
      publicApprovalBy: "관리자",
      publicApprovalMemo: "고객사명 비공개 조건으로 공개 가능"
    });

    expect(result.success).toBe(true);
  });
});
