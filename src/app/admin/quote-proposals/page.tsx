import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { AdminNav } from "@/components/AdminNav";
import { formatKrw } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  isQuoteProposalStatus,
  QUOTE_PROPOSAL_STATUSES,
  QUOTE_PROPOSAL_STATUS_LABELS
} from "@/lib/quote-proposal-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short" }).format(value);
}

export default async function AdminQuoteProposalsPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const q = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const status = typeof searchParams?.status === "string" ? searchParams.status : "";
  const from = typeof searchParams?.from === "string" ? searchParams.from : "";
  const to = typeof searchParams?.to === "string" ? searchParams.to : "";
  const where: Prisma.QuoteProposalWhereInput = {};

  if (q) {
    where.OR = [
      { proposalNumber: { contains: q } },
      { customerNameSnapshot: { contains: q } },
      { companyNameSnapshot: { contains: q } },
      { boxType: { contains: q } }
    ];
  }

  if (isQuoteProposalStatus(status)) where.status = status;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(`${from}T00:00:00`);
    if (to) where.createdAt.lte = new Date(`${to}T23:59:59.999`);
  }

  const proposals = await prisma.quoteProposal.findMany({
    where,
    include: { lead: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  });

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-proposals" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">견적안 관리</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              견적안은 관리자 검토 후 작성하는 내부 문서입니다. 자동 예상 범위와 실제 견적은 다를 수 있습니다.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 lg:grid-cols-[1fr_180px_160px_160px_auto]">
          <label className="block">
            <span className="label-base">검색</span>
            <input name="q" defaultValue={q} placeholder="견적안 번호, 고객명, 회사명, 박스 종류" className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">상태</span>
            <select name="status" defaultValue={status} className="input-base mt-2">
              <option value="">전체</option>
              {QUOTE_PROPOSAL_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {QUOTE_PROPOSAL_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">시작일</span>
            <input type="date" name="from" defaultValue={from} className="input-base mt-2" />
          </label>
          <label className="block">
            <span className="label-base">종료일</span>
            <input type="date" name="to" defaultValue={to} className="input-base mt-2" />
          </label>
          <div className="flex items-end">
            <button type="submit" className="focus-ring min-h-11 w-full rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white">
              적용
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold text-charcoal">
                <tr>
                  <th className="px-4 py-3">견적안 번호</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">고객명</th>
                  <th className="px-4 py-3">회사명</th>
                  <th className="px-4 py-3">박스 종류</th>
                  <th className="px-4 py-3">총 견적 금액</th>
                  <th className="px-4 py-3">유효일</th>
                  <th className="px-4 py-3">작성일</th>
                  <th className="px-4 py-3">수정일</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-neutral-500">
                      조건에 맞는 견적안이 없습니다.
                    </td>
                  </tr>
                ) : (
                  proposals.map((proposal) => (
                    <tr key={proposal.id}>
                      <td className="px-4 py-3 font-bold text-ink">{proposal.proposalNumber}</td>
                      <td className="px-4 py-3">{QUOTE_PROPOSAL_STATUS_LABELS[proposal.status as keyof typeof QUOTE_PROPOSAL_STATUS_LABELS] ?? proposal.status}</td>
                      <td className="px-4 py-3">{proposal.customerNameSnapshot}</td>
                      <td className="px-4 py-3">{proposal.companyNameSnapshot ?? "-"}</td>
                      <td className="px-4 py-3">{proposal.boxType}</td>
                      <td className="px-4 py-3 font-semibold">{formatKrw(proposal.totalAmountKrw)}</td>
                      <td className="px-4 py-3">{formatDate(proposal.validUntil)}</td>
                      <td className="px-4 py-3">{formatDate(proposal.createdAt)}</td>
                      <td className="px-4 py-3">{formatDate(proposal.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/admin/quote-proposals/${proposal.id}`} className="rounded-md border border-line px-3 py-2 text-xs font-bold text-ink hover:border-ink">
                            상세 보기
                          </Link>
                          {proposal.leadId ? (
                            <Link href={`/admin/leads/${proposal.leadId}`} className="rounded-md border border-line px-3 py-2 text-xs font-bold text-ink hover:border-ink">
                              리드
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
