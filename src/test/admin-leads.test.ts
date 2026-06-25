import { describe, expect, it } from "vitest";
import {
  buildLeadConsultationSummary,
  buildLeadListQuery,
  formatConsultationSummaryListForTextarea,
  formatFinishingOptionsForCsv,
  formatReadinessChecklistForCsv,
  formatReadinessScoreForCsv,
  formatUrgentForCsv,
  getDisplayConsultationSummary,
  getReadinessListLabel,
  getReadinessStatusText,
  hasManualConsultationSummary,
  PACKAGE_INQUIRY_CSV_HEADERS,
  parseManualConsultationSummary,
  parseFinishingOptions,
  parseReadinessChecklist,
  splitConsultationTextareaLines
} from "@/lib/admin-leads";

describe("admin lead display helpers", () => {
  it("parses finishing options from JSON string safely", () => {
    expect(parseFinishingOptions(JSON.stringify(["무광코팅", "박"]))).toEqual(["무광코팅", "박"]);
    expect(parseFinishingOptions("not-json")).toEqual([]);
    expect(parseFinishingOptions(null)).toEqual([]);
  });

  it("parses readiness checklist from JSON string safely", () => {
    const checklist = parseReadinessChecklist(
      JSON.stringify([
        { key: "size", label: "제품 실물 또는 정확한 사이즈가 있나요?", checked: true },
        { key: "budget", label: "예산 범위가 정해졌나요?", checked: false }
      ])
    );

    expect(checklist).toEqual([
      { key: "size", label: "제품 실물 또는 정확한 사이즈가 있나요?", checked: true },
      { key: "budget", label: "예산 범위가 정해졌나요?", checked: false }
    ]);
    expect(parseReadinessChecklist("not-json")).toEqual([]);
    expect(parseReadinessChecklist(undefined)).toEqual([]);
  });

  it("returns Korean readiness status text", () => {
    expect(getReadinessStatusText(null)).toBe("미계산");
    expect(getReadinessStatusText(30)).toBe("상담 전 추가 확인이 많이 필요한 문의입니다.");
    expect(getReadinessStatusText(70)).toBe("기본 상담이 가능한 문의입니다.");
    expect(getReadinessStatusText(100)).toBe("상담 준비도가 높은 문의입니다.");

    expect(getReadinessListLabel(null)).toBe("미계산");
    expect(getReadinessListLabel(30)).toBe("준비 낮음");
    expect(getReadinessListLabel(70)).toBe("기본 상담 가능");
    expect(getReadinessListLabel(100)).toBe("준비 높음");
  });

  it("builds package type and readiness filters for lead list", () => {
    const query = buildLeadListQuery(new URLSearchParams("packageType=싸바리박스&readiness=31-70&q=100개"));

    expect(query.packageType).toBe("싸바리박스");
    expect(query.readiness).toBe("31-70");
    expect(query.q).toBe("100개");
    expect(query.where.packageType).toBe("싸바리박스");
    expect(query.where.readinessScore).toEqual({ gte: 31, lte: 70 });
    expect(query.where.OR).toEqual(
      expect.arrayContaining([
        { packageType: { contains: "100개" } },
        { quantity: { contains: "100개" } }
      ])
    );
  });

  it("builds missing readiness filter for lead list", () => {
    const query = buildLeadListQuery(new URLSearchParams("readiness=missing"));

    expect(query.readiness).toBe("missing");
    expect(query.where.readinessScore).toBeNull();
  });

  it("formats package inquiry values for CSV export", () => {
    expect(formatFinishingOptionsForCsv(JSON.stringify(["무광코팅", "박", "창/PET"]))).toBe("무광코팅, 박, 창/PET");
    expect(formatFinishingOptionsForCsv("잘못된 JSON")).toBe("잘못된 JSON");
    expect(formatUrgentForCsv(true)).toBe("급건");
    expect(formatUrgentForCsv(false)).toBe("일반 일정");
    expect(formatReadinessScoreForCsv(85)).toBe("85");
    expect(formatReadinessScoreForCsv(null)).toBe("미계산");
  });

  it("formats readiness checklist values for CSV export", () => {
    expect(formatReadinessChecklistForCsv(JSON.stringify(["제품 실물 또는 정확한 사이즈가 있나요?", "희망 수량이 정해졌나요?"]))).toBe(
      "제품 실물 또는 정확한 사이즈가 있나요?, 희망 수량이 정해졌나요?"
    );

    expect(
      formatReadinessChecklistForCsv(
        JSON.stringify([
          { label: "제품 실물 또는 정확한 사이즈가 있나요?", checked: true },
          { label: "희망 수량이 정해졌나요?", checked: false },
          { label: "디자인 파일이 준비되어 있나요?", checked: true }
        ])
      )
    ).toBe("제품 실물 또는 정확한 사이즈가 있나요?, 디자인 파일이 준비되어 있나요?");

    expect(formatReadinessChecklistForCsv("깨진 JSON 원본")).toBe("깨진 JSON 원본");
  });

  it("exposes package inquiry CSV headers", () => {
    expect(PACKAGE_INQUIRY_CSV_HEADERS).toEqual(
      expect.arrayContaining([
        "패키지 종류",
        "패키지 구조",
        "고객 입력 수량",
        "급건 여부",
        "후가공",
        "제작 준비도 점수",
        "제작 준비 체크리스트",
        "내부 상담 메모"
      ])
    );
  });

  it("builds consultation summary for a lead with enough package information", () => {
    const summary = buildLeadConsultationSummary({
      packageType: "단상자",
      packageStructure: "삼면접착형",
      quantity: "1,000~3,000개",
      sizeInfo: "120 x 80 x 40mm",
      hasPhysicalProduct: "제품 실물이 있습니다",
      hasDesignFile: "AI 파일 있음",
      hasDieline: "도면 있음",
      desiredDueDate: "7월 말",
      budgetRange: "100~300만원",
      finishingOptions: JSON.stringify(["무광코팅"]),
      readinessScore: 85,
      message: "화장품 단상자 문의입니다. 내용물 무게는 약 120g입니다."
    });

    expect(summary.title).toBe("빠른 사양 검토 가능");
    expect(summary.overview).toContain("단상자");
    expect(summary.overview).toContain("1,000~3,000개");
    expect(summary.priorityNotes).toContain(
      "상담 준비도가 높은 문의입니다. 도면, 디자인 파일, 납기 조건을 중심으로 빠르게 검토할 수 있습니다."
    );
    expect(summary.suggestedNextActions).toContain("상담 후 견적 검토 단계로 넘긴다.");
  });

  it("flags urgent and low-readiness leads for priority consultation", () => {
    const summary = buildLeadConsultationSummary({
      packageType: "잘 모르겠어요",
      packageStructure: "잘 모르겠어요",
      quantity: "아직 미정",
      sizeInfo: "",
      hasPhysicalProduct: "아직 없습니다",
      hasDesignFile: "디자인 의뢰 필요",
      hasDieline: "도면 제작 필요",
      isUrgent: true,
      budgetRange: "아직 미정",
      finishingOptions: "not-json",
      readinessScore: 20
    });

    expect(summary.title).toBe("급건 일정 우선 확인 필요");
    expect(summary.priorityNotes).toEqual(
      expect.arrayContaining([
        "급건 문의입니다. 희망 납기와 제작 가능 일정을 먼저 확인하세요.",
        "패키지 종류가 명확하지 않습니다. 제품 특성과 사용 목적을 먼저 확인하세요.",
        "수량이 확정되지 않았습니다. 샘플, 소량, 본생산 중 어느 단계인지 확인하세요.",
        "상담 준비도가 낮습니다. 기본 제작 조건부터 차근차근 정리해야 합니다."
      ])
    );
    expect(summary.missingItems).toEqual(
      expect.arrayContaining(["패키지 종류", "패키지 구조", "수량", "사이즈", "디자인 파일", "도면"])
    );
    expect(summary.riskNotes).toEqual(
      expect.arrayContaining([
        "급건은 샘플, 후가공, 건조 시간, 배송 일정에 제한이 있을 수 있습니다.",
        "도면 제작이 필요한 문의입니다. 구조 상담과 샘플 확인 과정이 필요할 수 있습니다."
      ])
    );
    expect(summary.suggestedNextActions[0]).toBe("희망 납기와 실제 제작 가능 일정을 먼저 확인한다.");
  });

  it("adds finishing risk notes and remains safe for invalid finishing JSON", () => {
    const summary = buildLeadConsultationSummary({
      packageType: "싸바리박스",
      packageStructure: "상하분리형",
      quantity: "500~1,000개",
      sizeInfo: "200 x 120 x 60mm",
      hasPhysicalProduct: "제품 이미지만 있습니다",
      hasDesignFile: "이미지 파일만 있음",
      hasDieline: "도면 있음",
      finishingOptions: JSON.stringify(["박", "창/PET"]),
      readinessScore: 60
    });

    expect(summary.riskNotes).toEqual(
      expect.arrayContaining([
        "후가공이 포함된 문의입니다. 제작 기간과 최소 수량, 도면 위치 확인이 필요합니다.",
        "실물 없이 진행하는 경우 실제 제품 핏, 여유 공간, 오차 확인에 제한이 있을 수 있습니다.",
        "이미지 파일만 있는 경우 인쇄용 원본 데이터 확인이 필요합니다."
      ])
    );

    expect(() =>
      buildLeadConsultationSummary({
        finishingOptions: "{broken-json",
        readinessScore: null
      })
    ).not.toThrow();
  });

  it("returns safe consultation summary for sparse legacy lead data", () => {
    const summary = buildLeadConsultationSummary({
      message: "패키지 제작 문의드립니다."
    });

    expect(summary.overview).toContain("패키지 종류와 수량 정보가 아직 충분히 입력되지 않았습니다");
    expect(summary.priorityNotes.length).toBeGreaterThan(0);
    expect(summary.missingItems).toEqual(expect.arrayContaining(["패키지 종류", "수량", "사이즈"]));
    expect(summary.suggestedNextActions).toContain("상담 후 견적 검토 단계로 넘긴다.");
  });

  it("detects whether a lead has manual consultation summary fields", () => {
    expect(hasManualConsultationSummary({})).toBe(false);
    expect(hasManualConsultationSummary({ consultationPriorityNotes: "[]" })).toBe(false);
    expect(hasManualConsultationSummary({ consultationSummaryTitle: "직접 정리한 상담 요약" })).toBe(true);
    expect(hasManualConsultationSummary({ consultationNextActions: JSON.stringify(["납기 확인"]) })).toBe(true);
  });

  it("parses manual consultation summary safely", () => {
    const summary = parseManualConsultationSummary({
      consultationSummaryTitle: "수동 요약",
      consultationSummaryOverview: "상담자가 직접 정리한 내용입니다.",
      consultationPriorityNotes: JSON.stringify(["급건 일정 확인", "도면 확인"]),
      consultationMissingItems: "수량\n사이즈\n\n",
      consultationRiskNotes: "{broken-json",
      consultationNextActions: JSON.stringify([{ label: "고객에게 납기 확인" }])
    });

    expect(summary).toEqual({
      title: "수동 요약",
      overview: "상담자가 직접 정리한 내용입니다.",
      priorityNotes: ["급건 일정 확인", "도면 확인"],
      missingItems: ["수량", "사이즈"],
      riskNotes: ["{broken-json"],
      suggestedNextActions: ["고객에게 납기 확인"]
    });
    expect(parseManualConsultationSummary({ consultationPriorityNotes: "[]" })).toBeNull();
  });

  it("selects manual consultation summary before automatic summary", () => {
    const manual = getDisplayConsultationSummary({
      packageType: "단상자",
      quantity: "100~500개",
      consultationSummaryTitle: "관리자 직접 정리",
      consultationSummaryOverview: "전화 상담 후 정리한 내용입니다."
    });

    expect(manual.source).toBe("manual");
    expect(manual.summary.title).toBe("관리자 직접 정리");

    const auto = getDisplayConsultationSummary({
      packageType: "단상자",
      quantity: "100~500개"
    });

    expect(auto.source).toBe("auto");
    expect(auto.summary.overview).toContain("단상자");
  });

  it("converts consultation textarea lines and arrays for editing", () => {
    expect(splitConsultationTextareaLines("급건 확인\n\n도면 확인\r\n ")).toEqual(["급건 확인", "도면 확인"]);
    expect(formatConsultationSummaryListForTextarea(["급건 확인", "도면 확인"])).toBe("급건 확인\n도면 확인");
  });
});
