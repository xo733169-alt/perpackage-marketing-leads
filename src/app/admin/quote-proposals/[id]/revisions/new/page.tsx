import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { QuoteRevisionCreateForm } from "@/components/QuoteRevisionCreateForm";
import { formatKrw } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import { QUOTE_PROPOSAL_STATUS_LABELS, type QuoteProposalStatus } from "@/lib/quote-proposal-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(value);
}

export default async function NewQuoteProposalRevisionPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const proposal = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customerResponses: {
        where: { responseType: "REVISION_REQUESTED" },
        orderBy: { createdAt: "desc" },
        take: 1
      }
    }
  });

  if (!proposal) {
    notFound();
  }

  const revisionRequest = proposal.customerResponses[0] ?? null;

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-proposals" />
          <div>
            <Link href={`/admin/quote-proposals/${proposal.id}`} className="text-sm font-semibold text-neutral-600 hover:text-ink">
              견적안 상세로 돌아가기
            </Link>
            <p className="mt-4 text-sm font-bold text-brass">수정 견적안 작성</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{proposal.proposalNumber} 수정안</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
              기존 견적안을 덮어쓰지 않고 새 견적안으로 복제합니다. 수정안은 검토 후 별도로 공유 링크를 생성해야 합니다.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-6">
            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">이전 견적안 요약</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-bold text-neutral-500">견적안 번호</dt>
                  <dd className="mt-1 font-semibold text-ink">{proposal.proposalNumber}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-neutral-500">상태</dt>
                  <dd className="mt-1">
                    {QUOTE_PROPOSAL_STATUS_LABELS[proposal.status as QuoteProposalStatus] ?? proposal.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-neutral-500">수정 번호</dt>
                  <dd className="mt-1">{proposal.revisionNumber}차</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-neutral-500">합계</dt>
                  <dd className="mt-1 font-black text-ink">{formatKrw(proposal.totalAmountKrw)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-neutral-500">작성일</dt>
                  <dd className="mt-1">{formatDateTime(proposal.createdAt)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">기존 견적 항목</h2>
              <div className="mt-4 space-y-3">
                {proposal.items.map((item) => (
                  <div key={item.id} className="rounded-md border border-line p-3 text-sm">
                    <p className="font-bold text-ink">{item.itemName}</p>
                    <p className="mt-1 text-neutral-600">
                      {item.quantity.toLocaleString("ko-KR")}개 x {formatKrw(item.unitPriceKrw)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </aside>

          <div className="space-y-6">
            {revisionRequest ? (
              <section className="rounded-lg border border-brass/40 bg-white p-5">
                <h2 className="text-lg font-bold text-ink">고객 수정 요청</h2>
                <p className="mt-2 text-xs text-neutral-500">{formatDateTime(revisionRequest.createdAt)}</p>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-neutral-700">
                  {revisionRequest.message || "고객이 수정 요청을 남겼지만 별도 메시지는 없습니다."}
                </p>
              </section>
            ) : null}

            <QuoteRevisionCreateForm
              proposalId={proposal.id}
              initialReason={revisionRequest?.message ?? ""}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
