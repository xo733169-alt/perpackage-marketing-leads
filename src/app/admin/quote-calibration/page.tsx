import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { formatKrw } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  compareEstimateToProposal,
  ESTIMATE_COMPARISON_STATUS_LABELS,
  getCalibrationSummary,
  groupCalibrationByBoxType,
  groupCalibrationByQuantityRange,
  type EstimateComparisonStatus
} from "@/lib/quote-calibration";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatGap(value: number | null) {
  if (value === null) return "-";
  if (value === 0) return "0%";
  return `${value > 0 ? "+" : ""}${value}%`;
}

export default async function QuoteCalibrationPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const proposals = await prisma.quoteProposal.findMany({
    where: {
      status: { in: ["READY_TO_SEND", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] }
    },
    include: {
      lead: {
        select: {
          id: true,
          customerName: true,
          companyName: true,
          boxType: true,
          quantityRange: true,
          estimatedTotalPriceMinKrw: true,
          estimatedTotalPriceMaxKrw: true
        }
      }
    },
    orderBy: { updatedAt: "desc" },
    take: 300
  });

  const summary = getCalibrationSummary(proposals);
  const byBoxType = groupCalibrationByBoxType(proposals);
  const byQuantity = groupCalibrationByQuantityRange(proposals);
  const outliers = proposals
    .map((proposal) => ({
      proposal,
      comparison: compareEstimateToProposal(proposal.lead, proposal)
    }))
    .filter(({ comparison }) => comparison.status === "ABOVE_RANGE" || comparison.status === "BELOW_RANGE")
    .slice(0, 20);

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-calibration" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">견적 보정 대시보드</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              보정 후보입니다. 실제 제작 단가와 공정 기준을 확인한 뒤 견적 룰을 수동으로 조정하세요.
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            ["분석 견적안", summary.total],
            ["예상 범위 내", summary.inRange],
            ["예상보다 높음", summary.aboveRange],
            ["예상보다 낮음", summary.belowRange],
            ["예상 데이터 없음", summary.noEstimate],
            ["평균 차이", `${summary.averageGapPercent}%`]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-line bg-white p-4">
              <p className="text-xs font-bold text-neutral-500">{label}</p>
              <p className="mt-2 text-2xl font-black text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-ink">박스 종류별</h2>
            <div className="mt-4 space-y-3">
              {byBoxType.map((row) => (
                <div key={row.label} className="rounded-md border border-line p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <strong>{row.label}</strong>
                    <span>{row.total}건</span>
                  </div>
                  <p className="mt-2 text-neutral-600">
                    범위 내 {row.inRange} / 높음 {row.aboveRange} / 낮음 {row.belowRange} / 데이터 없음 {row.noEstimate}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-ink">수량 구간별</h2>
            <div className="mt-4 space-y-3">
              {byQuantity.map((row) => (
                <div key={row.label} className="rounded-md border border-line p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <strong>{row.label}</strong>
                    <span>{row.total}건</span>
                  </div>
                  <p className="mt-2 text-neutral-600">
                    범위 내 {row.inRange} / 높음 {row.aboveRange} / 낮음 {row.belowRange} / 데이터 없음 {row.noEstimate}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-bold text-ink">최근 보정 후보</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold text-charcoal">
                <tr>
                  <th className="px-4 py-3">고객</th>
                  <th className="px-4 py-3">박스 종류</th>
                  <th className="px-4 py-3">수량</th>
                  <th className="px-4 py-3">참고 범위</th>
                  <th className="px-4 py-3">견적안 합계</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">차이</th>
                  <th className="px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {outliers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-neutral-500">
                      보정 후보가 없습니다.
                    </td>
                  </tr>
                ) : (
                  outliers.map(({ proposal, comparison }) => (
                    <tr key={proposal.id}>
                      <td className="px-4 py-3">{proposal.customerNameSnapshot}</td>
                      <td className="px-4 py-3">{proposal.boxType}</td>
                      <td className="px-4 py-3">{proposal.quantityLabel ?? "-"}</td>
                      <td className="px-4 py-3">
                        {formatKrw(proposal.lead?.estimatedTotalPriceMinKrw)} ~ {formatKrw(proposal.lead?.estimatedTotalPriceMaxKrw)}
                      </td>
                      <td className="px-4 py-3 font-bold">{formatKrw(proposal.totalAmountKrw)}</td>
                      <td className="px-4 py-3">
                        {ESTIMATE_COMPARISON_STATUS_LABELS[comparison.status as EstimateComparisonStatus]}
                      </td>
                      <td className="px-4 py-3">{formatGap(comparison.gapPercent)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/admin/quote-proposals/${proposal.id}`} className="rounded-md border border-line px-3 py-2 text-xs font-bold text-ink">
                            견적안
                          </Link>
                          <Link href={`/admin/quote-rules?boxType=${encodeURIComponent(proposal.boxType)}`} className="rounded-md border border-line px-3 py-2 text-xs font-bold text-ink">
                            룰 보기
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
