import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminConsultationSummaryEditor } from "@/components/AdminConsultationSummaryEditor";
import { AdminLeadEditor } from "@/components/AdminLeadEditor";
import { AdminNav } from "@/components/AdminNav";
import { CopyButton } from "@/components/CopyButton";
import { DeleteLeadCommunicationButton } from "@/components/DeleteLeadCommunicationButton";
import { DeleteLeadButton } from "@/components/DeleteLeadButton";
import { LeadCommunicationForm } from "@/components/LeadCommunicationForm";
import { LeadCommunicationEditor } from "@/components/LeadCommunicationEditor";
import {
  buildLeadConsultationSummary,
  getDisplayConsultationSummary,
  getReadinessStatusText,
  parseFinishingOptions,
  parseReadinessChecklist
} from "@/lib/admin-leads";
import { formatKrw } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import { buildLeadTimeline, filterLeadTimelineItems } from "@/lib/lead-timeline";
import {
  LEAD_COMMUNICATION_CHANNEL_LABELS,
  LEAD_COMMUNICATION_DIRECTION_LABELS,
  type LeadCommunicationChannel,
  type LeadCommunicationDirection
} from "@/lib/lead-communication-schema";
import { isLeadStatus, STATUS_LABELS } from "@/lib/lead-options";
import {
  QUOTE_ACTIVITY_ACTOR_LABELS,
  QUOTE_ACTIVITY_TYPE_LABELS,
  type QuoteActivityType
} from "@/lib/quote-activity";
import {
  QUOTE_COMPLEXITY_LABELS,
  QUOTE_CONFIDENCE_LABELS,
  type QuoteComplexityLevel,
  type QuoteConfidenceLevel
} from "@/lib/quote-engine";
import { QUOTE_PROPOSAL_STATUS_LABELS, type QuoteProposalStatus } from "@/lib/quote-proposal-schema";
import { parseJsonStringList } from "@/lib/quote-rule-utils";
import { prisma } from "@/lib/prisma";
import { getTaskPriorityLabel, getTaskStatusLabel, getTaskTypeLabel, addDays } from "@/lib/sales-task";
import { getLeadSourceLabel } from "@/lib/source";

export const dynamic = "force-dynamic";

const kakaoMessage = `안녕하세요, 페르패키지입니다.
패키지 제작 문의 남겨주셔서 감사합니다.
정확한 견적 안내를 위해 남겨주신 내용을 확인 중입니다.
추가로 참고 이미지나 원하시는 패키지 느낌이 있으시면 보내주세요.`;

const missingDetailsMessage = `안녕하세요, 페르패키지입니다.
정확한 견적 안내를 위해 몇 가지 사양 확인이 필요합니다.

1. 원하시는 박스 사이즈
2. 제작 수량
3. 인쇄/후가공 여부
4. 참고 이미지 또는 원하시는 패키지 느낌
5. 희망 납기일

확인해주시면 사양에 맞춰 견적 안내드리겠습니다.`;

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

function formatDateTimeInput(value: Date | null) {
  if (!value) return "";
  const timezoneOffsetMs = value.getTimezoneOffset() * 60_000;
  return new Date(value.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function buildNewTaskUrl(params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  return `/admin/tasks/new?${searchParams.toString()}`;
}

function formatBoolean(value: boolean) {
  return value ? "동의" : "미동의";
}

function formatRange(min: number | null, max: number | null) {
  if (!min || !max) return "-";
  return `${formatKrw(min)} ~ ${formatKrw(max)}`;
}

function formatOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "미입력";
}

function formatListValue(values: string[]) {
  return values.length ? values.join(", ") : "미입력";
}

function formatUrgent(value: boolean) {
  return value ? "급건입니다" : "일반 일정";
}

function formatReadinessScore(value: number | null) {
  return value === null ? "미계산" : `${value}점`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <dt className="text-xs font-bold text-neutral-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink">{isEmpty ? "-" : value}</dd>
    </div>
  );
}

function SummaryList({ items, emptyLabel }: { items: string[]; emptyLabel: string }) {
  if (!items.length) {
    return <p className="mt-3 text-sm text-neutral-600">{emptyLabel}</p>;
  }

  return (
    <ul className="mt-3 space-y-2 text-sm leading-6 text-charcoal">
      {items.map((item) => (
        <li key={item}>• {item}</li>
      ))}
    </ul>
  );
}

function buildQuoteCalculatorUrl(lead: {
  boxType: string;
  quantityRange: string;
  widthMm: number | null;
  depthMm: number | null;
  heightMm: number | null;
  printOption: string;
  finishingOptions: string | null;
}) {
  const params = new URLSearchParams({
    boxType: lead.boxType,
    quantityRange: lead.quantityRange,
    printOption: lead.printOption
  });

  if (lead.widthMm) params.set("widthMm", String(lead.widthMm));
  if (lead.depthMm) params.set("depthMm", String(lead.depthMm));
  if (lead.heightMm) params.set("heightMm", String(lead.heightMm));

  const finishingOptions = parseFinishingOptions(lead.finishingOptions);
  if (finishingOptions.length) params.set("finishingOptions", finishingOptions.join(","));

  return `/admin/quote-calculator?${params.toString()}`;
}

export default async function AdminLeadDetailPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id }
  });

  if (!lead) {
    notFound();
  }

  const quoteProposals = await prisma.quoteProposal.findMany({
    where: { leadId: lead.id },
    include: {
      customerResponses: { orderBy: { createdAt: "desc" }, take: 1 },
      shareLinks: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });
  const communicationLogs = await prisma.leadCommunicationLog.findMany({
    where: { leadId: lead.id },
    orderBy: { contactedAt: "desc" },
    take: 30
  });
  const quoteActivities = await prisma.quoteActivityLog.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "desc" },
    take: 30
  });
  const salesTasks = await prisma.salesTask.findMany({
    where: { leadId: lead.id },
    include: { quoteProposal: { select: { id: true, proposalNumber: true } } },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    take: 30
  });

  const status = isLeadStatus(lead.status) ? lead.status : "NEW";
  const finishingOptions = parseFinishingOptions(lead.finishingOptions);
  const readinessChecklist = parseReadinessChecklist(lead.readinessChecklist);
  const checkedReadinessItems = readinessChecklist.filter((item) => item.checked);
  const uncheckedReadinessItems = readinessChecklist.filter((item) => !item.checked);
  const autoConsultationSummary = buildLeadConsultationSummary({
    packageType: lead.packageType,
    packageStructure: lead.packageStructure,
    quantity: lead.quantity,
    sizeInfo: lead.sizeInfo,
    hasPhysicalProduct: lead.hasPhysicalProduct,
    hasDesignFile: lead.hasDesignFile,
    hasDieline: lead.hasDieline,
    desiredDueDate: lead.desiredDueDate,
    isUrgent: lead.isUrgent,
    budgetRange: lead.budgetRange,
    finishingOptions: lead.finishingOptions,
    readinessScore: lead.readinessScore,
    message: lead.message,
    referenceNote: lead.referenceNote,
    consultationNotes: lead.consultationNotes
  });
  const { summary: consultationSummary, source: consultationSummarySource } = getDisplayConsultationSummary({
    packageType: lead.packageType,
    packageStructure: lead.packageStructure,
    quantity: lead.quantity,
    sizeInfo: lead.sizeInfo,
    hasPhysicalProduct: lead.hasPhysicalProduct,
    hasDesignFile: lead.hasDesignFile,
    hasDieline: lead.hasDieline,
    desiredDueDate: lead.desiredDueDate,
    isUrgent: lead.isUrgent,
    budgetRange: lead.budgetRange,
    finishingOptions: lead.finishingOptions,
    readinessScore: lead.readinessScore,
    message: lead.message,
    referenceNote: lead.referenceNote,
    consultationNotes: lead.consultationNotes,
    consultationSummaryTitle: lead.consultationSummaryTitle,
    consultationSummaryOverview: lead.consultationSummaryOverview,
    consultationPriorityNotes: lead.consultationPriorityNotes,
    consultationMissingItems: lead.consultationMissingItems,
    consultationRiskNotes: lead.consultationRiskNotes,
    consultationNextActions: lead.consultationNextActions
  });
  const quoteNotes = parseJsonStringList(lead.quoteCalculationNotes);
  const quoteMissingFields = parseJsonStringList(lead.quoteMissingFields);
  const complexityLabel =
    QUOTE_COMPLEXITY_LABELS[lead.quoteComplexityLevel as QuoteComplexityLevel] ?? lead.quoteComplexityLevel ?? "-";
  const confidenceLabel =
    QUOTE_CONFIDENCE_LABELS[lead.quoteConfidenceLevel as QuoteConfidenceLevel] ?? lead.quoteConfidenceLevel ?? "-";
  const proposalGroups = Array.from(
    quoteProposals
      .reduce((groups, proposal) => {
        const groupId = proposal.revisionGroupId ?? proposal.id;
        const group = groups.get(groupId) ?? [];
        group.push(proposal);
        groups.set(groupId, group);
        return groups;
      }, new Map<string, typeof quoteProposals>())
      .entries()
  )
    .map(([groupId, proposals]) => {
      const sorted = [...proposals].sort((a, b) => {
        if (a.isLatestRevision !== b.isLatestRevision) return a.isLatestRevision ? -1 : 1;
        return (b.revisionNumber ?? 1) - (a.revisionNumber ?? 1);
      });
      const latest = sorted[0];
      return {
        groupId,
        proposals: sorted,
        latest,
        hasRevisionRequest: sorted.some((proposal) =>
          proposal.customerResponses.some((response) => response.responseType === "REVISION_REQUESTED")
        ),
        hasAcceptedResponse: sorted.some((proposal) =>
          proposal.customerResponses.some((response) => response.responseType === "ACCEPTED")
        )
      };
    })
    .sort((a, b) => b.latest.createdAt.getTime() - a.latest.createdAt.getTime());
  const latestProposal = proposalGroups[0]?.latest ?? null;
  const hasCustomerRevisionRequest = proposalGroups.some((group) => group.hasRevisionRequest);
  const hasCustomerAcceptedResponse = proposalGroups.some((group) => group.hasAcceptedResponse);
  const timelineFilter = null;
  const timelineItems = filterLeadTimelineItems(
    buildLeadTimeline({
      lead,
      communicationLogs,
      quoteActivities,
      quoteProposals,
      salesTasks
    }),
    timelineFilter
  ).slice(0, 60);
  const followUpTaskUrl = buildNewTaskUrl({
    leadId: lead.id,
    title: `${lead.customerName} 후속 연락`,
    type: "FOLLOW_UP",
    priority: "NORMAL",
    dueAt: formatDateTimeInput(lead.nextFollowUpAt ?? addDays(new Date(), 1)),
    sourceType: "LEAD_FOLLOW_UP",
    sourceId: lead.id
  });

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/leads" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/admin/leads" className="text-sm font-semibold text-neutral-600 hover:text-ink">
                리드 목록으로 돌아가기
              </Link>
              <h1 className="mt-3 text-3xl font-black text-ink">{lead.customerName} 문의 상세</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton value={lead.phone} label="연락처 복사" />
              <CopyButton value={kakaoMessage} label="카카오톡 문구 복사" />
              <CopyButton value={missingDetailsMessage} label="추가 사양 요청 문구 복사" />
              <DeleteLeadButton leadId={lead.id} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">기본 문의 정보</h2>
              <dl className="mt-4">
                <Row label="고객명" value={lead.customerName} />
                <Row label="회사명" value={formatOptionalText(lead.companyName)} />
                <Row label="연락처" value={lead.phone} />
                <Row label="이메일" value={formatOptionalText(lead.email)} />
                <Row label="카카오톡 ID" value={formatOptionalText(lead.kakaoId)} />
                <Row label="문의 내용" value={formatOptionalText(lead.message)} />
                <Row label="문의일" value={formatDateTime(lead.createdAt)} />
                <Row label="상태" value={STATUS_LABELS[status]} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">제작 정보</h2>
              <dl className="mt-4 grid gap-x-6 md:grid-cols-2">
                <Row label="업종" value={lead.industry} />
                <Row label="박스 종류" value={lead.boxType} />
                <Row label="가로 mm" value={lead.widthMm} />
                <Row label="세로 mm" value={lead.depthMm} />
                <Row label="높이 mm" value={lead.heightMm} />
                <Row label="제작 수량" value={lead.quantityRange} />
                <Row label="인쇄 여부" value={lead.printOption} />
                <Row label="후가공" value={finishingOptions.length ? finishingOptions.join(", ") : "-"} />
                <Row label="희망 납기일" value={formatDateTime(lead.desiredDeliveryDate)} />
                <Row label="예산 범위" value={lead.budgetRange} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">패키지 제작 정보</h2>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                고객이 문의폼에서 선택한 제작 준비 정보입니다. “잘 모르겠어요”는 상담으로 함께 정리하면 되는 항목입니다.
              </p>
              <dl className="mt-4 grid gap-x-6 md:grid-cols-2">
                <Row label="패키지 종류" value={formatOptionalText(lead.packageType)} />
                <Row label="패키지 구조" value={formatOptionalText(lead.packageStructure)} />
                <Row label="수량" value={formatOptionalText(lead.quantity)} />
                <Row label="사이즈 정보" value={formatOptionalText(lead.sizeInfo)} />
                <Row label="제품 실물 여부" value={formatOptionalText(lead.hasPhysicalProduct)} />
                <Row label="디자인 파일 여부" value={formatOptionalText(lead.hasDesignFile)} />
                <Row label="도면 여부" value={formatOptionalText(lead.hasDieline)} />
                <Row label="희망 납기" value={formatOptionalText(lead.desiredDueDate)} />
                <Row label="급건 여부" value={formatUrgent(lead.isUrgent)} />
                <Row label="예산 범위" value={formatOptionalText(lead.budgetRange)} />
                <Row label="후가공" value={formatListValue(finishingOptions)} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">제작 준비도</h2>
              <dl className="mt-4 grid gap-x-6 md:grid-cols-2">
                <Row label="준비도 점수" value={formatReadinessScore(lead.readinessScore)} />
                <Row label="상태 문구" value={getReadinessStatusText(lead.readinessScore)} />
              </dl>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-line bg-ivory p-4">
                  <h3 className="text-sm font-bold text-ink">체크된 항목</h3>
                  {checkedReadinessItems.length ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-charcoal">
                      {checkedReadinessItems.map((item) => (
                        <li key={item.key}>• {item.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-neutral-600">미입력</p>
                  )}
                </div>
                <div className="rounded-md border border-line bg-white p-4">
                  <h3 className="text-sm font-bold text-ink">추가 확인이 필요한 항목</h3>
                  {uncheckedReadinessItems.length ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-charcoal">
                      {uncheckedReadinessItems.map((item) => (
                        <li key={item.key}>• {item.label}</li>
                      ))}
                    </ul>
                  ) : readinessChecklist.length ? (
                    <p className="mt-3 text-sm text-neutral-600">추가 확인 항목 없음</p>
                  ) : (
                    <p className="mt-3 text-sm text-neutral-600">미입력</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">관리자용 상담 정리</h2>
                  <p className="mt-2 text-xs leading-5 text-neutral-500">
                    상담 참고용 요약입니다. 최종 견적은 관리자 검토 후 확정됩니다.
                  </p>
                </div>
                <span className="inline-flex w-fit rounded-full bg-ink px-3 py-1 text-xs font-bold text-white">
                  {consultationSummarySource === "manual" ? "수동 저장 요약" : "자동 정리 요약"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                {consultationSummarySource === "manual" && lead.consultationSummaryUpdatedAt
                  ? `마지막 수동 수정일: ${formatDateTime(lead.consultationSummaryUpdatedAt)}`
                  : "아직 수동 저장 전입니다. 필요하면 자동 정리 요약을 바탕으로 수정해 저장하세요."}
              </p>
              <div className="mt-4 rounded-md border border-line bg-ivory p-4">
                <p className="text-sm font-bold text-ink">{consultationSummary.title}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-charcoal">{consultationSummary.overview}</p>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-line bg-white p-4">
                  <h3 className="text-sm font-bold text-ink">우선 확인 메모</h3>
                  <SummaryList items={consultationSummary.priorityNotes} emptyLabel="특이사항 없음" />
                </div>
                <div className="rounded-md border border-line bg-white p-4">
                  <h3 className="text-sm font-bold text-ink">부족한 정보</h3>
                  <SummaryList items={consultationSummary.missingItems} emptyLabel="추가 확인 항목 없음" />
                </div>
                <div className="rounded-md border border-line bg-white p-4">
                  <h3 className="text-sm font-bold text-ink">제작 주의사항</h3>
                  <SummaryList items={consultationSummary.riskNotes} emptyLabel="특이사항 없음" />
                </div>
                <div className="rounded-md border border-line bg-white p-4">
                  <h3 className="text-sm font-bold text-ink">다음 상담 액션</h3>
                  <SummaryList items={consultationSummary.suggestedNextActions} emptyLabel="추가 액션 없음" />
                </div>
              </div>
              <AdminConsultationSummaryEditor
                leadId={lead.id}
                source={consultationSummarySource}
                displaySummary={consultationSummary}
                autoSummary={autoConsultationSummary}
              />
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">내부 상담 메모</h2>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                패키지 상담 메모는 새 문의폼/API에서 넘어온 값입니다. 영업 메모와 관리자 메모 수정은 기존 상담 관리 영역을 사용합니다.
              </p>
              <dl className="mt-4">
                <Row label="패키지 상담 메모" value={formatOptionalText(lead.consultationNotes)} />
                <Row label="영업 메모" value={formatOptionalText(lead.salesNote)} />
                <Row label="관리자 메모" value={formatOptionalText(lead.adminMemo)} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">참고 자료 및 요청사항</h2>
              <dl className="mt-4">
                <Row label="참고 이미지/링크" value={lead.referenceNote} />
                <Row label="추가 요청사항" value={lead.message} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">연결 제작 사례</h2>
              <dl className="mt-4">
                <Row label="제작 사례 제목" value={lead.sourceCaseTitle} />
                <Row label="제작 사례 슬러그" value={lead.sourceCaseSlug} />
                {lead.sourceCaseSlug ? (
                  <Row
                    label="공개 페이지"
                    value={
                      <Link href={`/portfolio/${lead.sourceCaseSlug}`} className="font-semibold underline underline-offset-4">
                        /portfolio/{lead.sourceCaseSlug}
                      </Link>
                    }
                  />
                ) : null}
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">개인정보 동의 정보</h2>
              <dl className="mt-4 grid gap-x-6 md:grid-cols-2">
                <Row label="개인정보 동의 여부" value={formatBoolean(lead.privacyConsent)} />
                <Row label="개인정보 동의 일시" value={formatDateTime(lead.privacyConsentAt)} />
                <Row label="마케팅 수신 동의 여부" value={formatBoolean(lead.marketingConsent)} />
                <Row label="마케팅 수신 동의 일시" value={formatDateTime(lead.marketingConsentAt)} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">유입 정보</h2>
              <dl className="mt-4 grid gap-x-6 md:grid-cols-2">
                <Row label="유입 구분" value={getLeadSourceLabel(lead)} />
                <Row label="utm_source" value={lead.utmSource} />
                <Row label="utm_medium" value={lead.utmMedium} />
                <Row label="utm_campaign" value={lead.utmCampaign} />
                <Row label="utm_term" value={lead.utmTerm} />
                <Row label="utm_content" value={lead.utmContent} />
                <Row label="referrer" value={lead.referrer} />
                <Row label="landingPath" value={lead.landingPath} />
              </dl>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">리드 요약</h2>
              <dl className="mt-4">
                <Row label="접수일" value={formatDateTime(lead.createdAt)} />
                <Row label="수정일" value={formatDateTime(lead.updatedAt)} />
                <Row label="리드 점수" value={lead.leadScore} />
                <Row label="상담 상태" value={STATUS_LABELS[status]} />
                <Row label="다음 후속 연락일" value={formatDateTime(lead.nextFollowUpAt)} />
                <Row label="마지막 연락일" value={formatDateTime(lead.lastContactedAt)} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-ink">견적안</h2>
                <Link
                  href={`/admin/leads/${lead.id}/quote-proposals/new`}
                  className="focus-ring rounded-md bg-ink px-3 py-2 text-xs font-bold text-white"
                >
                  견적안 작성
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {quoteProposals.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    아직 작성된 견적안이 없습니다.
                  </p>
                ) : (
                  proposalGroups.map((group) => (
                    <div key={group.groupId} className="rounded-md border border-line p-3 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">
                            {group.latest.proposalNumber} · {group.latest.revisionNumber}차
                            {group.latest.isLatestRevision ? <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">최신</span> : null}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {QUOTE_PROPOSAL_STATUS_LABELS[group.latest.status as QuoteProposalStatus] ?? group.latest.status} ·{" "}
                            {formatKrw(group.latest.totalAmountKrw)}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500">
                            그룹 내 견적안 {group.proposals.length}개
                            {group.hasRevisionRequest ? " · 고객 수정 요청 있음" : ""}
                            {group.hasAcceptedResponse ? " · 고객 수락 있음" : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Link href={`/admin/quote-proposals/${group.latest.id}`} className="font-semibold underline underline-offset-4">
                            상세
                          </Link>
                          {group.latest.status !== "ACCEPTED" && group.latest.status !== "CANCELLED" && !group.latest.supersededByProposalId ? (
                            <Link href={`/admin/quote-proposals/${group.latest.id}/revisions/new`} className="font-semibold underline underline-offset-4">
                              수정안 만들기
                            </Link>
                          ) : null}
                          <Link href={`/admin/quote-proposals/${group.latest.id}/print`} className="font-semibold underline underline-offset-4">
                            인쇄
                          </Link>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 border-t border-line pt-3">
                        {group.proposals.map((proposal) => (
                          <div key={proposal.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
                            <span>
                              {proposal.revisionNumber}차 · {proposal.proposalNumber} ·{" "}
                              {QUOTE_PROPOSAL_STATUS_LABELS[proposal.status as QuoteProposalStatus] ?? proposal.status}
                            </span>
                            <span>작성일 {formatDateTime(proposal.createdAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {quoteProposals.length > 0 ? (
                <div className="mt-4 rounded-md border border-line bg-ivory p-3 text-xs leading-5 text-neutral-600">
                  총 견적안 {quoteProposals.length}개 · 최신 견적안 상태{" "}
                  {latestProposal
                    ? QUOTE_PROPOSAL_STATUS_LABELS[latestProposal.status as QuoteProposalStatus] ?? latestProposal.status
                    : "-"}
                  {hasCustomerRevisionRequest ? " · 고객 수정 요청 있음" : ""}
                  {hasCustomerAcceptedResponse ? " · 고객 수락 있음" : ""}
                </div>
              ) : null}
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-ink">연결 업무</h2>
                <div className="flex flex-wrap gap-2">
                  <Link href={followUpTaskUrl} className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-ink">
                    후속 연락 업무 만들기
                  </Link>
                  <Link
                    href={buildNewTaskUrl({ leadId: lead.id, title: `${lead.customerName} 업무`, type: "GENERAL", priority: "NORMAL" })}
                    className="focus-ring rounded-md bg-ink px-3 py-2 text-xs font-bold text-white"
                  >
                    업무 추가
                  </Link>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {salesTasks.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    연결된 업무가 없습니다.
                  </p>
                ) : (
                  salesTasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-line p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{task.title}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {getTaskTypeLabel(task.type)} · {getTaskPriorityLabel(task.priority)} · {getTaskStatusLabel(task.status)} ·{" "}
                            {formatDateTime(task.dueAt)}
                          </p>
                          {task.quoteProposal ? (
                            <Link href={`/admin/quote-proposals/${task.quoteProposal.id}`} className="mt-2 inline-flex text-xs font-bold underline underline-offset-4">
                              {task.quoteProposal.proposalNumber}
                            </Link>
                          ) : null}
                        </div>
                        <Link href={`/admin/tasks/${task.id}/edit`} className="font-semibold underline underline-offset-4">
                          수정
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">상담 이력</h2>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                전화, 카카오톡, 이메일, 미팅 등 실제 상담 내용을 관리자 전용 기록으로 남깁니다.
              </p>
              <div className="mt-4">
                <LeadCommunicationForm leadId={lead.id} />
              </div>
              <div className="mt-5 space-y-3">
                {communicationLogs.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    아직 상담 이력이 없습니다.
                  </p>
                ) : (
                  communicationLogs.map((log) => (
                    <div key={log.id} className="rounded-md border border-line p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{log.summary}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {LEAD_COMMUNICATION_CHANNEL_LABELS[log.channel as LeadCommunicationChannel] ?? log.channel} ·{" "}
                            {LEAD_COMMUNICATION_DIRECTION_LABELS[log.direction as LeadCommunicationDirection] ?? log.direction} ·{" "}
                            {formatDateTime(log.contactedAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <LeadCommunicationEditor
                            communicationId={log.id}
                            initialChannel={log.channel}
                            initialDirection={log.direction}
                            initialSummary={log.summary}
                            initialDetail={log.detail ?? ""}
                            initialContactedAt={formatDateTimeInput(log.contactedAt)}
                            initialNextFollowUpAt={formatDateTimeInput(log.nextFollowUpAt)}
                          />
                          <DeleteLeadCommunicationButton communicationId={log.id} />
                        </div>
                      </div>
                      {log.detail ? <p className="mt-3 whitespace-pre-wrap leading-6 text-neutral-700">{log.detail}</p> : null}
                      {log.nextFollowUpAt ? (
                        <p className="mt-2 text-xs font-semibold text-brass">다음 연락 예정일: {formatDateTime(log.nextFollowUpAt)}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">참고 견적 정보</h2>
              <p className="mt-2 text-xs leading-5 text-neutral-500">
                저장 시점의 견적 룰 기준 스냅샷입니다. 실제 견적은 상담 후 확정해야 합니다.
              </p>
              <dl className="mt-4">
                <Row label="참고용 개당 예상 범위" value={formatRange(lead.estimatedUnitPriceMinKrw, lead.estimatedUnitPriceMaxKrw)} />
                <Row label="참고용 총 예상 범위" value={formatRange(lead.estimatedTotalPriceMinKrw, lead.estimatedTotalPriceMaxKrw)} />
                <Row label="견적 신뢰도" value={confidenceLabel} />
                <Row label="견적 난이도" value={complexityLabel} />
                <Row label="누락된 항목" value={quoteMissingFields.length ? quoteMissingFields.join(", ") : "없음"} />
                <Row label="계산 메모" value={quoteNotes.length ? quoteNotes.join("\n") : "-"} />
                <Row label="견적 안내 문구" value={lead.estimateDisclaimer ?? lead.estimatedPriceRange} />
              </dl>
              <Link
                href={buildQuoteCalculatorUrl(lead)}
                className="focus-ring mt-5 inline-flex rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-ink"
              >
                견적 계산기로 다시 확인
              </Link>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">전체 활동 타임라인</h2>
              <div className="mt-4 space-y-3">
                {timelineItems.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    아직 활동 이력이 없습니다.
                  </p>
                ) : (
                  timelineItems.map((item) => (
                    <div key={item.id} className="rounded-md border border-line p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{item.label}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {formatDateTime(item.occurredAt)} · {item.actor ?? "-"} · {item.source ?? "-"}
                          </p>
                        </div>
                        {item.href ? (
                          <Link href={item.href} className="text-xs font-bold underline underline-offset-4">
                            보기
                          </Link>
                        ) : null}
                      </div>
                      <p className="mt-2 whitespace-pre-wrap leading-6 text-neutral-700">{item.description}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">견적 활동 내역</h2>
              <div className="mt-4 space-y-3">
                {quoteActivities.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    아직 견적 활동 내역이 없습니다.
                  </p>
                ) : (
                  quoteActivities.map((activity) => (
                    <div key={activity.id} className="rounded-md border border-line p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-bold text-ink">
                          {QUOTE_ACTIVITY_TYPE_LABELS[activity.type as QuoteActivityType] ?? activity.type}
                        </p>
                        <p className="text-xs text-neutral-500">{formatDateTime(activity.createdAt)}</p>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">
                        {QUOTE_ACTIVITY_ACTOR_LABELS[activity.actor] ?? activity.actor}
                      </p>
                      <p className="mt-2 leading-6 text-neutral-700">{activity.message}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">전환 정보</h2>
              <dl className="mt-4">
                <Row label="견적 발송일" value={formatDateTime(lead.quotedAt)} />
                <Row label="주문 확정일" value={formatDateTime(lead.orderConfirmedAt)} />
                <Row label="종료일" value={formatDateTime(lead.closedAt)} />
                <Row label="확정 주문 금액" value={lead.confirmedOrderAmountKrw ? formatKrw(lead.confirmedOrderAmountKrw) : "-"} />
                <Row label="종료/실패 사유" value={lead.lostReason} />
              </dl>
            </section>

            <AdminLeadEditor
              leadId={lead.id}
              initialStatus={status}
              initialMemo={lead.adminMemo ?? ""}
              initialSalesNote={lead.salesNote ?? ""}
              initialNextFollowUpAt={formatDateTimeInput(lead.nextFollowUpAt)}
              initialLastContactedAt={formatDateTimeInput(lead.lastContactedAt)}
              initialQuotedAt={formatDateTimeInput(lead.quotedAt)}
              initialOrderConfirmedAt={formatDateTimeInput(lead.orderConfirmedAt)}
              initialClosedAt={formatDateTimeInput(lead.closedAt)}
              initialConfirmedOrderAmountKrw={lead.confirmedOrderAmountKrw?.toString() ?? ""}
              initialLostReason={lead.lostReason ?? ""}
            />
          </aside>
        </div>
      </section>
    </main>
  );
}
