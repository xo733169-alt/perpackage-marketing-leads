import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { CopyButton } from "@/components/CopyButton";
import { QuoteProposalActions } from "@/components/QuoteProposalActions";
import { QuoteShareLinkManager } from "@/components/QuoteShareLinkManager";
import { formatKrw } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  QUOTE_ACTIVITY_ACTOR_LABELS,
  QUOTE_ACTIVITY_TYPE_LABELS,
  type QuoteActivityType
} from "@/lib/quote-activity";
import {
  ESTIMATE_COMPARISON_STATUS_LABELS,
  type EstimateComparisonStatus
} from "@/lib/quote-calibration";
import {
  QUOTE_PROPOSAL_STATUS_LABELS,
  type QuoteProposalStatus
} from "@/lib/quote-proposal-schema";
import {
  QUOTE_CUSTOMER_RESPONSE_LABELS,
  QUOTE_SHARE_LINK_STATUS_LABELS,
  type QuoteCustomerResponseType,
  type QuoteShareLinkStatus
} from "@/lib/quote-share-schema";
import { prisma } from "@/lib/prisma";
import { getTaskPriorityLabel, getTaskStatusLabel, getTaskTypeLabel } from "@/lib/sales-task";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
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

function buildNewTaskUrl(params: Record<string, string | number | null | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  return `/admin/tasks/new?${searchParams.toString()}`;
}

export default async function QuoteProposalDetailPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const proposal = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    include: {
      lead: { select: { id: true, customerName: true, companyName: true } },
      items: { orderBy: { sortOrder: "asc" } },
      shareLinks: { orderBy: { createdAt: "desc" }, take: 10 },
      customerResponses: { orderBy: { createdAt: "desc" } },
      activityLogs: { orderBy: { createdAt: "desc" }, take: 50 },
      salesTasks: { orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }], take: 20 }
    }
  });

  if (!proposal) {
    notFound();
  }

  const customerCopyMessage =
    proposal.customerMessage ||
    "페르패키지 견적안이 준비되었습니다. 세부 사양 확인 후 안내드린 금액이며, 최종 제작 조건에 따라 조정될 수 있습니다.";
  const now = new Date();
  const activeShareLink = proposal.shareLinks.find(
    (shareLink) =>
      shareLink.status === "ACTIVE" &&
      !shareLink.revokedAt &&
      shareLink.expiresAt.getTime() > now.getTime()
  );
  const revisionGroupId = proposal.revisionGroupId ?? proposal.id;
  const revisions = await prisma.quoteProposal.findMany({
    where: { OR: [{ revisionGroupId }, { id: revisionGroupId }] },
    orderBy: [{ revisionNumber: "desc" }, { createdAt: "desc" }]
  });
  const latestRevision = revisions.find((revision) => revision.isLatestRevision) ?? revisions[0] ?? proposal;
  const parentProposal = proposal.parentProposalId
    ? revisions.find((revision) => revision.id === proposal.parentProposalId)
    : null;
  const supersededByProposal = proposal.supersededByProposalId
    ? revisions.find((revision) => revision.id === proposal.supersededByProposalId)
    : null;
  const latestRevisionRequest = proposal.customerResponses.find(
    (response) => response.responseType === "REVISION_REQUESTED"
  );
  const hasNewerRevision = Boolean(proposal.supersededByProposalId);
  const isLatestRevision = proposal.isLatestRevision && latestRevision.id === proposal.id;
  const canCreateRevision = proposal.status !== "ACCEPTED" && proposal.status !== "CANCELLED" && !hasNewerRevision;

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-proposals" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/admin/quote-proposals" className="text-sm font-semibold text-neutral-600 hover:text-ink">
                견적안 목록으로 돌아가기
              </Link>
              <h1 className="mt-3 text-3xl font-black text-ink">{proposal.proposalNumber}</h1>
              <p className="mt-2 text-sm text-neutral-600">
                {QUOTE_PROPOSAL_STATUS_LABELS[proposal.status as QuoteProposalStatus] ?? proposal.status}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canCreateRevision ? (
                <Link href={`/admin/quote-proposals/${proposal.id}/revisions/new`} className="focus-ring rounded-md border border-brass bg-white px-4 py-2 text-sm font-bold text-ink">
                  수정안 만들기
                </Link>
              ) : null}
              {proposal.parentProposalId ? (
                <Link href={`/admin/quote-proposals/${proposal.id}/compare`} className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink">
                  이전 견적안 비교
                </Link>
              ) : null}
              <Link href={`/admin/quote-proposals/${proposal.id}/edit`} className="focus-ring rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
                편집
              </Link>
              <Link href={`/admin/quote-proposals/${proposal.id}/print`} className="focus-ring rounded-md border border-line bg-white px-4 py-2 text-sm font-bold text-ink">
                인쇄 보기
              </Link>
              <CopyButton value={customerCopyMessage} label="고객 안내 문구 복사" />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {proposal.status === "SUPERSEDED" || proposal.supersededByProposalId ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900">
              이 견적안은 새 수정안으로 대체되었습니다.
              {supersededByProposal ? (
                <Link href={`/admin/quote-proposals/${supersededByProposal.id}`} className="ml-2 font-bold underline underline-offset-4">
                  {supersededByProposal.proposalNumber} 보기
                </Link>
              ) : null}
            </div>
          ) : null}
          {latestRevisionRequest && !hasNewerRevision ? (
            <div className="rounded-lg border border-brass/40 bg-white px-5 py-4 text-sm leading-6 text-ink">
              <p className="font-bold">고객이 수정 요청을 남겼습니다. 수정 견적안을 작성해 주세요.</p>
              <p className="mt-1 whitespace-pre-wrap text-neutral-700">{latestRevisionRequest.message ?? "별도 메시지는 없습니다."}</p>
              <Link href={`/admin/quote-proposals/${proposal.id}/revisions/new`} className="focus-ring mt-3 inline-flex rounded-md bg-ink px-4 py-2 text-xs font-bold text-white">
                수정안 만들기
              </Link>
            </div>
          ) : null}
          {!isLatestRevision ? (
            <div className="rounded-lg border border-line bg-ivory px-5 py-4 text-sm leading-6 text-neutral-700">
              이 견적안은 최신 수정안이 아닙니다. 고객에게 공유하기 전 최신 견적안을 기준으로 확인해 주세요.
              {latestRevision?.id ? (
                <Link href={`/admin/quote-proposals/${latestRevision.id}`} className="ml-2 font-bold underline underline-offset-4">
                  최신 수정안 보기
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">견적 항목</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[760px] w-full border-collapse text-left text-sm">
                  <thead className="bg-ivory text-xs font-bold text-charcoal">
                    <tr>
                      <th className="px-4 py-3">항목</th>
                      <th className="px-4 py-3">설명</th>
                      <th className="px-4 py-3">수량</th>
                      <th className="px-4 py-3">단가</th>
                      <th className="px-4 py-3">금액</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {proposal.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-bold text-ink">{item.itemName}</td>
                        <td className="px-4 py-3 whitespace-pre-wrap text-neutral-700">{item.description ?? "-"}</td>
                        <td className="px-4 py-3">{item.quantity.toLocaleString("ko-KR")}</td>
                        <td className="px-4 py-3">{formatKrw(item.unitPriceKrw)}</td>
                        <td className="px-4 py-3 font-bold">{formatKrw(item.amountKrw)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-5 grid gap-3 rounded-md border border-line bg-ivory p-4 sm:grid-cols-3">
                <Row label="공급가" value={formatKrw(proposal.subtotalAmountKrw)} />
                <Row label="부가세" value={formatKrw(proposal.vatAmountKrw)} />
                <Row label="합계" value={formatKrw(proposal.totalAmountKrw)} />
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">제작 사양</h2>
              <dl className="mt-4">
                <Row label="박스 종류" value={proposal.boxType} />
                <Row label="업종" value={proposal.industry} />
                <Row label="수량" value={proposal.quantityLabel} />
                <Row label="사양 요약" value={proposal.specificationSummary} />
                <Row label="제작 메모" value={proposal.productionNotes} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">고객 안내</h2>
              <dl className="mt-4">
                <Row label="납기 안내" value={proposal.deliveryEstimateText} />
                <Row label="결제 조건" value={proposal.paymentTerms} />
                <Row label="고객 안내 문구" value={proposal.customerMessage} />
                <Row label="내부 메모" value={proposal.internalMemo} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">고객 응답</h2>
              <div className="mt-4 space-y-3">
                {proposal.customerResponses.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    아직 고객 응답이 없습니다.
                  </p>
                ) : (
                  proposal.customerResponses.map((response) => (
                    <div key={response.id} className="rounded-md border border-line p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black text-ink">
                          {QUOTE_CUSTOMER_RESPONSE_LABELS[
                            response.responseType as QuoteCustomerResponseType
                          ] ?? response.responseType}
                        </p>
                        <p className="text-xs text-neutral-500">{formatDateTime(response.createdAt)}</p>
                      </div>
                      <dl className="mt-3 space-y-2">
                        <div>
                          <dt className="text-xs font-bold text-neutral-500">담당자명</dt>
                          <dd className="mt-1">{response.responderName ?? "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-bold text-neutral-500">메시지</dt>
                          <dd className="mt-1 whitespace-pre-wrap leading-6">{response.message ?? "-"}</dd>
                        </div>
                      </dl>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">견적안 수정 이력</h2>
                  <p className="mt-1 text-xs text-neutral-500">
                    현재 {proposal.revisionNumber}차 수정안 · {isLatestRevision ? "최신 수정안" : "이전 수정안"}
                  </p>
                </div>
                {canCreateRevision ? (
                  <Link href={`/admin/quote-proposals/${proposal.id}/revisions/new`} className="focus-ring w-fit rounded-md bg-ink px-3 py-2 text-xs font-bold text-white">
                    수정안 만들기
                  </Link>
                ) : null}
              </div>

              <dl className="mt-4 grid gap-x-6 md:grid-cols-2">
                <Row label="수정 그룹" value={revisionGroupId} />
                <Row
                  label="이전 견적안"
                  value={
                    parentProposal ? (
                      <Link href={`/admin/quote-proposals/${parentProposal.id}`} className="font-semibold underline underline-offset-4">
                        {parentProposal.proposalNumber}
                      </Link>
                    ) : (
                      "-"
                    )
                  }
                />
                <Row
                  label="대체한 견적안"
                  value={
                    supersededByProposal ? (
                      <Link href={`/admin/quote-proposals/${supersededByProposal.id}`} className="font-semibold underline underline-offset-4">
                        {supersededByProposal.proposalNumber}
                      </Link>
                    ) : (
                      "-"
                    )
                  }
                />
                <Row label="수정 사유" value={proposal.revisionReason} />
              </dl>

              <div className="mt-5 space-y-3">
                {revisions.map((revision) => (
                  <div key={revision.id} className={`rounded-md border p-3 text-sm ${revision.id === proposal.id ? "border-ink bg-ivory" : "border-line bg-white"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-ink">
                          {revision.proposalNumber} · {revision.revisionNumber}차
                          {revision.isLatestRevision ? <span className="ml-2 rounded-full bg-ink px-2 py-0.5 text-[11px] text-white">최신</span> : null}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {QUOTE_PROPOSAL_STATUS_LABELS[revision.status as QuoteProposalStatus] ?? revision.status} · {formatKrw(revision.totalAmountKrw)} · {formatDateTime(revision.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/quote-proposals/${revision.id}`} className="font-semibold underline underline-offset-4">
                          보기
                        </Link>
                        {revision.parentProposalId ? (
                          <Link href={`/admin/quote-proposals/${revision.id}/compare`} className="font-semibold underline underline-offset-4">
                            비교
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            {!isLatestRevision ? (
              <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
                <h2 className="font-bold">공유 전 확인</h2>
                <p className="mt-2">최신 수정안이 아닌 견적안입니다. 고객에게 공유하기 전 최신 수정안을 확인해 주세요.</p>
              </section>
            ) : null}

            <QuoteShareLinkManager
              proposalId={proposal.id}
              activeShareLink={
                activeShareLink
                  ? {
                      id: activeShareLink.id,
                      statusLabel:
                        QUOTE_SHARE_LINK_STATUS_LABELS[activeShareLink.status as QuoteShareLinkStatus] ??
                        activeShareLink.status,
                      expiresAt: formatDateTime(activeShareLink.expiresAt),
                      createdAt: formatDateTime(activeShareLink.createdAt),
                      firstViewedAt: formatDateTime(activeShareLink.firstViewedAt),
                      lastViewedAt: formatDateTime(activeShareLink.lastViewedAt),
                      viewCount: activeShareLink.viewCount,
                      tokenPreview: activeShareLink.tokenPreview
                    }
                  : null
              }
            />

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">기본 정보</h2>
              <dl className="mt-4">
                <Row label="견적안 번호" value={proposal.proposalNumber} />
                <Row label="제목" value={proposal.title} />
                <Row label="상태" value={QUOTE_PROPOSAL_STATUS_LABELS[proposal.status as QuoteProposalStatus] ?? proposal.status} />
                <Row label="작성일" value={formatDate(proposal.createdAt)} />
                <Row label="수정일" value={formatDate(proposal.updatedAt)} />
                <Row label="유효일" value={formatDate(proposal.validUntil)} />
                <Row
                  label="관련 리드"
                  value={
                    proposal.leadId ? (
                      <Link href={`/admin/leads/${proposal.leadId}`} className="font-semibold underline underline-offset-4">
                        {proposal.lead?.customerName ?? proposal.leadId}
                      </Link>
                    ) : (
                      "-"
                    )
                  }
                />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">고객 스냅샷</h2>
              <dl className="mt-4">
                <Row label="고객명" value={proposal.customerNameSnapshot} />
                <Row label="회사명" value={proposal.companyNameSnapshot} />
                <Row label="연락처" value={proposal.phoneSnapshot} />
                <Row label="이메일" value={proposal.emailSnapshot} />
                <Row label="카카오톡 ID" value={proposal.kakaoIdSnapshot} />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">예상 범위 비교</h2>
              <dl className="mt-4">
                <Row label="기준 예상 문구" value={proposal.basedOnEstimateLabel} />
                <Row
                  label="비교 상태"
                  value={
                    ESTIMATE_COMPARISON_STATUS_LABELS[
                      proposal.estimateComparisonStatus as EstimateComparisonStatus
                    ] ?? proposal.estimateComparisonStatus ?? "-"
                  }
                />
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-ink">연결 업무</h2>
                <Link
                  href={buildNewTaskUrl({
                    quoteProposalId: proposal.id,
                    leadId: proposal.leadId,
                    title: `${proposal.proposalNumber} 업무`,
                    type: "GENERAL",
                    priority: "NORMAL"
                  })}
                  className="focus-ring rounded-md bg-ink px-3 py-2 text-xs font-bold text-white"
                >
                  업무 추가
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={buildNewTaskUrl({
                    quoteProposalId: proposal.id,
                    leadId: proposal.leadId,
                    title: `${proposal.proposalNumber} 고객 확인`,
                    type: "CUSTOMER_RESPONSE",
                    priority: "NORMAL",
                    sourceType: "QUOTE_CUSTOMER_RESPONSE",
                    sourceId: proposal.id
                  })}
                  className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-bold text-ink"
                >
                  고객 확인 업무 만들기
                </Link>
                {latestRevisionRequest ? (
                  <Link
                    href={buildNewTaskUrl({
                      quoteProposalId: proposal.id,
                      leadId: proposal.leadId,
                      title: `${proposal.proposalNumber} 수정 요청 검토`,
                      type: "REVISION_REVIEW",
                      priority: "HIGH",
                      sourceType: "REVISION_REQUEST",
                      sourceId: latestRevisionRequest.id
                    })}
                    className="focus-ring rounded-md border border-brass bg-white px-3 py-2 text-xs font-bold text-ink"
                  >
                    수정 요청 검토 업무 만들기
                  </Link>
                ) : null}
              </div>
              <div className="mt-4 space-y-3">
                {proposal.salesTasks.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    연결된 업무가 없습니다.
                  </p>
                ) : (
                  proposal.salesTasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-line p-3 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-ink">{task.title}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            {getTaskTypeLabel(task.type)} · {getTaskPriorityLabel(task.priority)} · {getTaskStatusLabel(task.status)} ·{" "}
                            {formatDateTime(task.dueAt)}
                          </p>
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

            <QuoteProposalActions proposalId={proposal.id} />

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">활동 내역</h2>
              <div className="mt-4 space-y-3">
                {proposal.activityLogs.length === 0 ? (
                  <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">
                    아직 활동 내역이 없습니다.
                  </p>
                ) : (
                  proposal.activityLogs.map((activity) => (
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
          </aside>
        </div>
      </section>
    </main>
  );
}
