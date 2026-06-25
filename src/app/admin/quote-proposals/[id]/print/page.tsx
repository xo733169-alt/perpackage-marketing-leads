import { notFound, redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import { formatKrw } from "@/lib/analytics";
import { isAdminAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(value);
}

export default async function QuoteProposalPrintPage({ params }: { params: { id: string } }) {
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

  return (
    <main className="min-h-screen bg-white px-6 py-8 text-ink print:px-0 print:py-0">
      <style>{`
        @page { size: A4; margin: 18mm; }
        @media print {
          .print-hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
      <div className="mx-auto max-w-4xl border border-line bg-white p-8 print:border-0 print:p-0">
        <div className="print-hidden mb-6 flex justify-end">
          <PrintButton />
        </div>

        <header className="border-b-2 border-ink pb-6">
          <p className="text-sm font-bold tracking-[0.18em] text-neutral-500">PERPACKAGE</p>
          <h1 className="mt-3 text-4xl font-black">페르패키지 견적 안내</h1>
          <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
            <p>견적안 번호: {proposal.proposalNumber}</p>
            <p>작성일: {formatDate(proposal.createdAt)}</p>
            <p>유효일: {formatDate(proposal.validUntil)}</p>
            <p>표시: {proposal.vatIncluded ? "부가세 포함" : "부가세 별도 계산"}</p>
          </div>
        </header>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-base font-black">고객 정보</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-bold text-neutral-500">고객명</dt>
                <dd>{proposal.customerNameSnapshot}</dd>
              </div>
              <div>
                <dt className="font-bold text-neutral-500">회사명</dt>
                <dd>{proposal.companyNameSnapshot ?? "-"}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h2 className="text-base font-black">제작 사양</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div>
                <dt className="font-bold text-neutral-500">박스 종류</dt>
                <dd>{proposal.boxType}</dd>
              </div>
              <div>
                <dt className="font-bold text-neutral-500">수량</dt>
                <dd>{proposal.quantityLabel ?? proposal.quantityCount ?? "-"}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-base font-black">사양 요약</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{proposal.specificationSummary ?? "-"}</p>
        </section>

        <section className="mt-8">
          <h2 className="text-base font-black">견적 항목</h2>
          <table className="mt-3 w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-ink bg-neutral-50">
                <th className="px-3 py-3 text-left">항목</th>
                <th className="px-3 py-3 text-left">설명</th>
                <th className="px-3 py-3 text-right">수량</th>
                <th className="px-3 py-3 text-right">단가</th>
                <th className="px-3 py-3 text-right">금액</th>
              </tr>
            </thead>
            <tbody>
              {proposal.items.map((item) => (
                <tr key={item.id} className="border-b border-line">
                  <td className="px-3 py-3 font-bold">{item.itemName}</td>
                  <td className="px-3 py-3 whitespace-pre-wrap">{item.description ?? "-"}</td>
                  <td className="px-3 py-3 text-right">{item.quantity.toLocaleString("ko-KR")}</td>
                  <td className="px-3 py-3 text-right">{formatKrw(item.unitPriceKrw)}</td>
                  <td className="px-3 py-3 text-right font-bold">{formatKrw(item.amountKrw)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 flex justify-end">
          <dl className="w-full max-w-sm space-y-3 text-sm">
            <div className="flex justify-between border-b border-line pb-2">
              <dt>공급가</dt>
              <dd className="font-bold">{formatKrw(proposal.subtotalAmountKrw)}</dd>
            </div>
            <div className="flex justify-between border-b border-line pb-2">
              <dt>부가세</dt>
              <dd className="font-bold">{formatKrw(proposal.vatAmountKrw)}</dd>
            </div>
            <div className="flex justify-between border-b-2 border-ink pb-3 text-lg">
              <dt className="font-black">합계</dt>
              <dd className="font-black">{formatKrw(proposal.totalAmountKrw)}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-base font-black">납기 안내</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{proposal.deliveryEstimateText ?? "상담 후 안내드립니다."}</p>
          </div>
          <div>
            <h2 className="text-base font-black">결제 조건</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{proposal.paymentTerms ?? "상담 후 안내드립니다."}</p>
          </div>
        </section>

        <footer className="mt-10 border-t border-line pt-5 text-xs leading-6 text-neutral-600">
          <p>
            본 견적안은 입력된 사양 기준의 안내 금액이며, 최종 제작 조건, 원자재, 후가공, 일정 확인에 따라 조정될 수 있습니다.
          </p>
          {proposal.customerMessage ? <p className="mt-2 whitespace-pre-wrap">{proposal.customerMessage}</p> : null}
        </footer>
      </div>
    </main>
  );
}
