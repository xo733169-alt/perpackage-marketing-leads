import { NextResponse } from "next/server";
import {
  buildLeadListQuery,
  formatFinishingOptionsForCsv,
  formatReadinessChecklistForCsv,
  formatReadinessScoreForCsv,
  formatUrgentForCsv,
  PACKAGE_INQUIRY_CSV_HEADERS,
  parseFinishingOptions
} from "@/lib/admin-leads";
import { isAdminAuthenticated } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/lead-options";
import { prisma } from "@/lib/prisma";
import { getLeadSourceLabel } from "@/lib/source";

function escapeCsv(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function formatDate(value: Date | null): string {
  return value ? value.toISOString() : "";
}

function formatBoolean(value: boolean): string {
  return value ? "Y" : "N";
}

export async function GET(request: Request) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ message: "인증이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const { where, orderBy } = buildLeadListQuery(searchParams);
  const leads = await prisma.lead.findMany({ where, orderBy });

  const header = [
    "접수일",
    "수정일",
    "고객명",
    "회사명",
    "연락처",
    "이메일",
    "카카오톡 ID",
    "업종",
    "박스 종류",
    "가로 mm",
    "세로 mm",
    "높이 mm",
    "제작 수량",
    "인쇄 여부",
    "후가공",
    "희망 납기일",
    "예산 범위",
    "참고 이미지/링크",
    "추가 요청사항",
    "개인정보 동의 여부",
    "개인정보 동의 일시",
    "마케팅 수신 동의 여부",
    "마케팅 수신 동의 일시",
    "유입 구분",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "referrer",
    "landingPath",
    "연결 제작 사례 슬러그",
    "연결 제작 사례 제목",
    "참고 예상 범위",
    "참고 개당 예상 최소",
    "참고 개당 예상 최대",
    "참고 총 예상 최소",
    "참고 총 예상 최대",
    "견적 안내 문구",
    "견적 신뢰도",
    "견적 난이도",
    "견적 누락 항목",
    "견적 계산 메모",
    "리드 점수",
    "상담 상태",
    "다음 후속 연락일",
    "마지막 연락일",
    "견적 발송일",
    "주문 확정일",
    "종료일",
    "확정 주문 금액",
    "종료/실패 사유",
    "영업 메모",
    "관리자 메모",
    ...PACKAGE_INQUIRY_CSV_HEADERS
  ];

  const rows = leads.map((lead) => [
    formatDate(lead.createdAt),
    formatDate(lead.updatedAt),
    lead.customerName,
    lead.companyName,
    lead.phone,
    lead.email,
    lead.kakaoId,
    lead.industry,
    lead.boxType,
    lead.widthMm,
    lead.depthMm,
    lead.heightMm,
    lead.quantityRange,
    lead.printOption,
    parseFinishingOptions(lead.finishingOptions).join(", "),
    formatDate(lead.desiredDeliveryDate),
    lead.budgetRange,
    lead.referenceNote,
    lead.message,
    formatBoolean(lead.privacyConsent),
    formatDate(lead.privacyConsentAt),
    formatBoolean(lead.marketingConsent),
    formatDate(lead.marketingConsentAt),
    getLeadSourceLabel(lead),
    lead.utmSource,
    lead.utmMedium,
    lead.utmCampaign,
    lead.utmTerm,
    lead.utmContent,
    lead.referrer,
    lead.landingPath,
    lead.sourceCaseSlug,
    lead.sourceCaseTitle,
    lead.estimatedPriceRange,
    lead.estimatedUnitPriceMinKrw,
    lead.estimatedUnitPriceMaxKrw,
    lead.estimatedTotalPriceMinKrw,
    lead.estimatedTotalPriceMaxKrw,
    lead.estimateDisclaimer,
    lead.quoteConfidenceLevel,
    lead.quoteComplexityLevel,
    lead.quoteMissingFields,
    lead.quoteCalculationNotes,
    lead.leadScore,
    STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS] ?? lead.status,
    formatDate(lead.nextFollowUpAt),
    formatDate(lead.lastContactedAt),
    formatDate(lead.quotedAt),
    formatDate(lead.orderConfirmedAt),
    formatDate(lead.closedAt),
    lead.confirmedOrderAmountKrw,
    lead.lostReason,
    lead.salesNote,
    lead.adminMemo,
    lead.packageType,
    lead.packageStructure,
    lead.quantity,
    lead.sizeInfo,
    lead.hasPhysicalProduct,
    lead.hasDesignFile,
    lead.hasDieline,
    lead.desiredDueDate,
    formatUrgentForCsv(lead.isUrgent),
    lead.budgetRange,
    formatFinishingOptionsForCsv(lead.finishingOptions),
    formatReadinessScoreForCsv(lead.readinessScore),
    formatReadinessChecklistForCsv(lead.readinessChecklist),
    lead.consultationNotes
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="perpackage-leads.csv"`
    }
  });
}
