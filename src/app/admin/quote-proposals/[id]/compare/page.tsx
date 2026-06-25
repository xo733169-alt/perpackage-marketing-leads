import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { formatKrw } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  compareProposalItems,
  compareProposalTotals,
  REVISION_COMPARISON_LABELS,
  type RevisionComparisonStatus
} from "@/lib/quote-proposal-revision";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatPercent(value: number | null) {
  if (value === null) return "-";
  return `${value.toFixed(1)}%`;
}

function TextCompareRow({ label, previous, current }: { label: string; previous: string | null; current: string | null }) {
  const changed = (previous ?? "") !== (current ?? "");

  return (
    <div className="grid gap-3 border-b border-line py-4 last:border-b-0 md:grid-cols-[160px_1fr_1fr]">
      <p className="text-xs font-bold text-neutral-500">{label}</p>
      <p className="whitespace-pre-wrap rounded-md bg-ivory p-3 text-sm leading-6 text-neutral-700">{previous || "-"}</p>
      <p className={`whitespace-pre-wrap rounded-md p-3 text-sm leading-6 ${changed ? "bg-brass/10 text-ink" : "bg-ivory text-neutral-700"}`}>
        {current || "-"}
      </p>
    </div>
  );
}

export default async function QuoteProposalComparePage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const proposal = await prisma.quoteProposal.findUnique({
    where: { id: params.id },
    include: { items: { orderBy: { sortOrder: "asc" } } }
  });

  if (!proposal) {
    notFound();
  }

  const previousProposal = proposal.parentProposalId
    ? await prisma.quoteProposal.findUnique({
        where: { id: proposal.parentProposalId },
        include: { items: { orderBy: { sortOrder: "asc" } } }
      })
    : null;

  const itemComparisons = previousProposal ? compareProposalItems(previousProposal.items, proposal.items) : [];
  const totalComparison = previousProposal ? compareProposalTotals(previousProposal, proposal) : null;

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-proposals" />
          <div>
            <Link href={`/admin/quote-proposals/${proposal.id}`} className="text-sm font-semibold text-neutral-600 hover:text-ink">
              견적안 상세로 돌아가기
            </Link>
            <p className="mt-4 text-sm font-bold text-brass">견적안 비교</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{proposal.proposalNumber}</h1>
          </div>
        </div>

        {!previousProposal || !totalComparison ? (
          <section className="mt-8 rounded-lg border border-line bg-white p-6">
            <h2 className="text-lg font-bold text-ink">비교할 이전 견적안이 없습니다.</h2>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              첫 견적안이거나 부모 견적안 정보가 없는 경우 비교 화면을 제공하지 않습니다.
            </p>
          </section>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">비교 요약</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-md border border-line p-4">
                  <p className="text-xs font-bold text-neutral-500">이전 견적안</p>
                  <p className="mt-2 font-black text-ink">{previousProposal.proposalNumber}</p>
                </div>
                <div className="rounded-md border border-line p-4">
                  <p className="text-xs font-bold text-neutral-500">현재 견적안</p>
                  <p className="mt-2 font-black text-ink">{proposal.proposalNumber}</p>
                </div>
                <div className="rounded-md border border-line p-4">
                  <p className="text-xs font-bold text-neutral-500">금액 차이</p>
                  <p className="mt-2 font-black text-ink">{formatKrw(totalComparison.totalDifference)}</p>
                </div>
                <div className="rounded-md border border-line p-4">
                  <p className="text-xs font-bold text-neutral-500">차이율</p>
                  <p className="mt-2 font-black text-ink">{formatPercent(totalComparison.totalDifferencePercent)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">견적 항목 비교</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[860px] w-full border-collapse text-left text-sm">
                  <thead className="bg-ivory text-xs font-bold text-charcoal">
                    <tr>
                      <th className="px-4 py-3">항목</th>
                      <th className="px-4 py-3">이전</th>
                      <th className="px-4 py-3">현재</th>
                      <th className="px-4 py-3">변경 상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {itemComparisons.map((comparison) => (
                      <tr key={comparison.key}>
                        <td className="px-4 py-3 font-bold text-ink">
                          {comparison.currentItem?.itemName ?? comparison.previousItem?.itemName ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          {comparison.previousItem
                            ? `${comparison.previousItem.quantity.toLocaleString("ko-KR")}개 x ${formatKrw(comparison.previousItem.unitPriceKrw)}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {comparison.currentItem
                            ? `${comparison.currentItem.quantity.toLocaleString("ko-KR")}개 x ${formatKrw(comparison.currentItem.unitPriceKrw)}`
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {comparison.statuses
                            .map((status) => REVISION_COMPARISON_LABELS[status as RevisionComparisonStatus])
                            .join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-lg font-bold text-ink">문구 및 조건 비교</h2>
              <div className="mt-4">
                <TextCompareRow label="사양 요약" previous={previousProposal.specificationSummary} current={proposal.specificationSummary} />
                <TextCompareRow label="제작 메모" previous={previousProposal.productionNotes} current={proposal.productionNotes} />
                <TextCompareRow label="납기 안내" previous={previousProposal.deliveryEstimateText} current={proposal.deliveryEstimateText} />
                <TextCompareRow label="결제 조건" previous={previousProposal.paymentTerms} current={proposal.paymentTerms} />
                <TextCompareRow label="고객 안내 문구" previous={previousProposal.customerMessage} current={proposal.customerMessage} />
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
