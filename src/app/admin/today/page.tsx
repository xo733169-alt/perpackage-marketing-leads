import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { CreateTaskFromCandidateButton, CompleteTaskButton } from "@/components/TaskQuickActions";
import { isAdminAuthenticated } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/lead-options";
import { prisma } from "@/lib/prisma";
import {
  buildLeadFollowUpTaskCandidate,
  buildQuoteProposalTaskCandidate,
  buildRevisionRequestTaskCandidate,
  buildShareLinkExpiryTaskCandidate,
  endOfDay,
  formatTaskDueLabel,
  getTaskPriorityLabel,
  getTaskStatusLabel,
  getTaskTypeLabel,
  isTaskOverdue,
  shouldCreateTaskFromCandidate,
  sortTasksForToday,
  type SalesTaskCandidate
} from "@/lib/sales-task";
import { QUOTE_PROPOSAL_STATUS_LABELS, type QuoteProposalStatus } from "@/lib/quote-proposal-schema";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(value);
}

function serializeCandidate(candidate: SalesTaskCandidate) {
  return {
    ...candidate,
    dueAt: candidate.dueAt ? candidate.dueAt.toISOString() : null
  };
}

function CardCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-xs font-bold text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-ink">{value.toLocaleString("ko-KR")}</p>
    </div>
  );
}

export default async function AdminTodayPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = endOfDay(now);
  const twoDaysLater = endOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  const [
    openTasks,
    newLeads,
    followUpLeads,
    revisionRequestProposals,
    quoteActionProposals,
    expiringShareLinks,
    existingOpenSourceTasks
  ] = await Promise.all([
    prisma.salesTask.findMany({
      where: { status: { in: ["TODO", "IN_PROGRESS"] }, dueAt: { lte: todayEnd } },
      include: {
        lead: { select: { id: true, customerName: true } },
        quoteProposal: { select: { id: true, proposalNumber: true } }
      },
      take: 50
    }),
    prisma.lead.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.lead.findMany({
      where: {
        nextFollowUpAt: { lte: todayEnd },
        status: { notIn: ["CLOSED", "ORDER_CONFIRMED"] }
      },
      orderBy: { nextFollowUpAt: "asc" },
      take: 20
    }),
    prisma.quoteProposal.findMany({
      where: {
        status: { notIn: ["ACCEPTED", "CANCELLED", "SUPERSEDED"] },
        supersededByProposalId: null,
        customerResponses: { some: { responseType: "REVISION_REQUESTED" } }
      },
      include: {
        customerResponses: { where: { responseType: "REVISION_REQUESTED" }, orderBy: { createdAt: "desc" }, take: 1 },
        lead: { select: { id: true, customerName: true } }
      },
      orderBy: { updatedAt: "desc" },
      take: 20
    }),
    prisma.quoteProposal.findMany({
      where: {
        OR: [
          { status: "READY_TO_SEND", shareLinks: { none: { status: "ACTIVE" } } },
          { status: "DRAFT", updatedAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
          { status: "SENT", updatedAt: { lte: threeDaysAgo }, customerResponses: { none: {} } }
        ],
        supersededByProposalId: null
      },
      include: {
        shareLinks: { where: { status: "ACTIVE" }, take: 1 },
        customerResponses: { take: 1 },
        lead: { select: { id: true, customerName: true } }
      },
      orderBy: { updatedAt: "asc" },
      take: 30
    }),
    prisma.quoteProposalShareLink.findMany({
      where: {
        status: "ACTIVE",
        revokedAt: null,
        expiresAt: { gte: now, lte: twoDaysLater },
        quoteProposal: { status: { notIn: ["ACCEPTED", "REJECTED", "CANCELLED", "SUPERSEDED"] } }
      },
      include: {
        quoteProposal: { select: { id: true, proposalNumber: true, leadId: true, status: true } }
      },
      orderBy: { expiresAt: "asc" },
      take: 20
    }),
    prisma.salesTask.findMany({
      where: {
        status: { notIn: ["DONE", "CANCELLED"] },
        sourceType: { not: null },
        sourceId: { not: null }
      },
      select: { sourceType: true, sourceId: true, status: true }
    })
  ]);

  const sortedTasks = sortTasksForToday(openTasks, now);
  const overdueTasksCount = openTasks.filter((task) => isTaskOverdue(task, now)).length;
  const dueFollowUpCandidates = followUpLeads.map((lead) => buildLeadFollowUpTaskCandidate(lead, now));
  const revisionCandidates = revisionRequestProposals.map((proposal) =>
    buildRevisionRequestTaskCandidate(proposal, proposal.customerResponses[0])
  );
  const quoteActionCandidates = quoteActionProposals.map((proposal) => {
    if (proposal.status === "READY_TO_SEND") return buildQuoteProposalTaskCandidate(proposal, "SHARE");
    if (proposal.status === "SENT") return buildQuoteProposalTaskCandidate(proposal, "CUSTOMER_CHECK");
    return buildQuoteProposalTaskCandidate(proposal, "PREP");
  });
  const shareLinkCandidates = expiringShareLinks.map((shareLink) => buildShareLinkExpiryTaskCandidate(shareLink));

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/today" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-brass">관리자</p>
              <h1 className="mt-2 text-3xl font-black text-ink">오늘 할 일</h1>
              <p className="mt-2 text-sm text-neutral-600">외부 발송 없이 관리자가 직접 확인해야 할 영업 업무를 모아봅니다.</p>
            </div>
            <Link href="/admin/tasks/new" className="focus-ring w-fit rounded-md bg-ink px-4 py-2 text-sm font-bold text-white">
              수동 업무 추가
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CardCount label="오늘 처리할 일" value={sortedTasks.length} />
          <CardCount label="기한 지난 업무" value={overdueTasksCount} />
          <CardCount label="신규 문의" value={newLeads.length} />
          <CardCount label="후속 연락 필요" value={followUpLeads.length} />
          <CardCount label="고객 수정 요청" value={revisionRequestProposals.length} />
          <CardCount label="견적안 발송 준비" value={quoteActionProposals.filter((proposal) => proposal.status === "READY_TO_SEND").length} />
          <CardCount label="고객 응답 확인" value={quoteActionProposals.filter((proposal) => proposal.status === "SENT").length} />
          <CardCount label="곧 만료되는 공유 링크" value={expiringShareLinks.length} />
        </div>

        <section className="mt-8 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-black text-ink">오늘 업무</h2>
          <div className="mt-4 space-y-3">
            {sortedTasks.length === 0 ? (
              <p className="rounded-md border border-line bg-ivory px-4 py-3 text-sm text-neutral-600">오늘까지 처리할 수동 업무가 없습니다.</p>
            ) : (
              sortedTasks.map((task) => (
                <div key={task.id} className="rounded-md border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-ink">{task.title}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {getTaskTypeLabel(task.type)} · {getTaskPriorityLabel(task.priority)} · {getTaskStatusLabel(task.status)} ·{" "}
                        {formatTaskDueLabel(task.dueAt, now)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.lead ? <Link href={`/admin/leads/${task.lead.id}`} className="text-xs font-bold underline underline-offset-4">리드 보기</Link> : null}
                      {task.quoteProposal ? <Link href={`/admin/quote-proposals/${task.quoteProposal.id}`} className="text-xs font-bold underline underline-offset-4">견적안 보기</Link> : null}
                      <CompleteTaskButton taskId={task.id} />
                      <Link href={`/admin/tasks/${task.id}/edit`} className="text-xs font-bold underline underline-offset-4">수정</Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-black text-ink">신규 문의 확인</h2>
            <div className="mt-4 space-y-3">
              {newLeads.length === 0 ? <p className="text-sm text-neutral-500">검토할 신규 문의가 없습니다.</p> : null}
              {newLeads.map((lead) => {
                const candidate = buildLeadFollowUpTaskCandidate(lead, now);
                return (
                  <div key={lead.id} className="rounded-md border border-line p-4 text-sm">
                    <p className="font-bold text-ink">{lead.customerName}</p>
                    <p className="mt-1 text-xs text-neutral-500">{lead.companyName ?? "-"} · {lead.boxType} · {lead.quantityRange}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/admin/leads/${lead.id}`} className="font-semibold underline underline-offset-4">리드 보기</Link>
                      {shouldCreateTaskFromCandidate(candidate, existingOpenSourceTasks) ? (
                        <CreateTaskFromCandidateButton candidate={serializeCandidate(candidate)} label="후속 연락 업무 만들기" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-black text-ink">후속 연락 필요</h2>
            <div className="mt-4 space-y-3">
              {followUpLeads.length === 0 ? <p className="text-sm text-neutral-500">기한이 된 후속 연락 리드가 없습니다.</p> : null}
              {followUpLeads.map((lead, index) => {
                const candidate = dueFollowUpCandidates[index];
                return (
                  <div key={lead.id} className="rounded-md border border-line p-4 text-sm">
                    <p className="font-bold text-ink">{lead.customerName}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {STATUS_LABELS[lead.status as keyof typeof STATUS_LABELS] ?? lead.status} · 다음 연락 {formatDateTime(lead.nextFollowUpAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/admin/leads/${lead.id}`} className="font-semibold underline underline-offset-4">리드 보기</Link>
                      {shouldCreateTaskFromCandidate(candidate, existingOpenSourceTasks) ? (
                        <CreateTaskFromCandidateButton candidate={serializeCandidate(candidate)} label="후속 연락 업무 만들기" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-black text-ink">고객 수정 요청</h2>
            <div className="mt-4 space-y-3">
              {revisionRequestProposals.length === 0 ? <p className="text-sm text-neutral-500">처리할 수정 요청이 없습니다.</p> : null}
              {revisionRequestProposals.map((proposal, index) => {
                const candidate = revisionCandidates[index];
                return (
                  <div key={proposal.id} className="rounded-md border border-line p-4 text-sm">
                    <p className="font-bold text-ink">{proposal.proposalNumber}</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-600">{proposal.customerResponses[0]?.message ?? "수정 요청 메시지 없음"}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/admin/quote-proposals/${proposal.id}`} className="font-semibold underline underline-offset-4">견적안 보기</Link>
                      <Link href={`/admin/quote-proposals/${proposal.id}/revisions/new`} className="font-semibold underline underline-offset-4">수정안 만들기</Link>
                      {shouldCreateTaskFromCandidate(candidate, existingOpenSourceTasks) ? (
                        <CreateTaskFromCandidateButton candidate={serializeCandidate(candidate)} label="검토 업무 만들기" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-black text-ink">견적안 조치 필요</h2>
            <div className="mt-4 space-y-3">
              {quoteActionProposals.length === 0 ? <p className="text-sm text-neutral-500">조치할 견적안이 없습니다.</p> : null}
              {quoteActionProposals.map((proposal, index) => {
                const candidate = quoteActionCandidates[index];
                return (
                  <div key={proposal.id} className="rounded-md border border-line p-4 text-sm">
                    <p className="font-bold text-ink">{proposal.proposalNumber}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {QUOTE_PROPOSAL_STATUS_LABELS[proposal.status as QuoteProposalStatus] ?? proposal.status} · 수정일 {formatDateTime(proposal.updatedAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/admin/quote-proposals/${proposal.id}`} className="font-semibold underline underline-offset-4">견적안 보기</Link>
                      {shouldCreateTaskFromCandidate(candidate, existingOpenSourceTasks) ? (
                        <CreateTaskFromCandidateButton candidate={serializeCandidate(candidate)} label="업무 만들기" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-lg border border-line bg-white p-5 xl:col-span-2">
            <h2 className="text-lg font-black text-ink">곧 만료되는 공유 링크</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {expiringShareLinks.length === 0 ? <p className="text-sm text-neutral-500">곧 만료되는 공유 링크가 없습니다.</p> : null}
              {expiringShareLinks.map((shareLink, index) => {
                const candidate = shareLinkCandidates[index];
                return (
                  <div key={shareLink.id} className="rounded-md border border-line p-4 text-sm">
                    <p className="font-bold text-ink">{shareLink.quoteProposal.proposalNumber}</p>
                    <p className="mt-1 text-xs text-neutral-500">만료일 {formatDateTime(shareLink.expiresAt)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/admin/quote-proposals/${shareLink.quoteProposalId}`} className="font-semibold underline underline-offset-4">견적안 보기</Link>
                      {shouldCreateTaskFromCandidate(candidate, existingOpenSourceTasks) ? (
                        <CreateTaskFromCandidateButton candidate={serializeCandidate(candidate)} label="만료 확인 업무 만들기" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
