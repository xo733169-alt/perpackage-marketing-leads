import type { Metadata } from "next";
import Link from "next/link";
import { QuoteShareResponseForm } from "@/components/QuoteShareResponseForm";
import { formatKrw } from "@/lib/analytics";
import { stringifyActivityMetadata } from "@/lib/quote-activity";
import { hashQuoteShareToken, isShareLinkUsable } from "@/lib/quote-share";
import {
  QUOTE_CUSTOMER_RESPONSE_LABELS,
  type QuoteCustomerResponseType
} from "@/lib/quote-share-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "페르패키지 견적 안내",
  robots: {
    index: false,
    follow: false
  }
};

const quoteDisclaimer =
  "본 견적안은 입력된 사양 기준의 안내 금액이며, 최종 제작 조건, 원자재, 후가공, 일정 확인에 따라 조정될 수 있습니다.";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(value);
}

function InvalidQuoteSharePage() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell flex min-h-screen items-center justify-center py-12">
        <div className="max-w-xl rounded-lg border border-line bg-white p-8 text-center">
          <p className="text-sm font-bold tracking-[0.18em] text-neutral-500">PERPACKAGE</p>
          <h1 className="mt-4 text-2xl font-black text-ink">유효하지 않거나 만료된 견적안 링크입니다.</h1>
          <p className="mt-4 text-sm leading-7 text-neutral-600">
            견적안 확인이 필요하시면 페르패키지에 다시 문의해 주세요.
          </p>
          <Link href="/" className="focus-ring mt-6 inline-flex rounded-md bg-ink px-5 py-3 text-sm font-bold text-white">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}

export default async function QuoteSharePage({ params }: { params: { token: string } }) {
  const token = decodeURIComponent(params.token);
  const tokenHash = hashQuoteShareToken(token);
  const now = new Date();
  const shareLink = await prisma.quoteProposalShareLink.findUnique({
    where: { tokenHash },
    include: {
      quoteProposal: {
        include: {
          items: { orderBy: { sortOrder: "asc" } }
        }
      },
      customerResponses: { orderBy: { createdAt: "desc" }, take: 1 }
    }
  });

  if (!shareLink) {
    return <InvalidQuoteSharePage />;
  }

  if (shareLink.status === "ACTIVE" && shareLink.expiresAt.getTime() <= now.getTime()) {
    await prisma.quoteProposalShareLink.update({
      where: { id: shareLink.id },
      data: { status: "EXPIRED" }
    });
    return <InvalidQuoteSharePage />;
  }

  if (!isShareLinkUsable(shareLink, now)) {
    return <InvalidQuoteSharePage />;
  }

  const proposal = shareLink.quoteProposal;
  if (proposal.status === "SUPERSEDED" || !proposal.isLatestRevision) {
    return <InvalidQuoteSharePage />;
  }

  await prisma.$transaction([
    prisma.quoteProposalShareLink.update({
      where: { id: shareLink.id },
      data: {
        firstViewedAt: shareLink.firstViewedAt ?? now,
        lastViewedAt: now,
        viewCount: { increment: 1 }
      }
    }),
    prisma.quoteActivityLog.create({
      data: {
        leadId: proposal.leadId,
        quoteProposalId: proposal.id,
        type: "SHARE_LINK_VIEWED",
        actor: "customer",
        message: "고객이 견적안을 확인했습니다.",
        metadataJson: stringifyActivityMetadata({
          shareLinkId: shareLink.id,
          tokenPreview: shareLink.tokenPreview
        })
      }
    })
  ]);

  const existingResponse = shareLink.customerResponses[0];

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="rounded-lg border border-line bg-white p-5 sm:p-8">
          <header className="border-b-2 border-ink pb-6">
            <p className="text-sm font-bold tracking-[0.18em] text-neutral-500">PERPACKAGE</p>
            <h1 className="mt-3 text-3xl font-black text-ink">페르패키지 견적 안내</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
              아래 견적안은 입력된 제작 사양을 기준으로 안내드리는 금액입니다. 최종 제작 조건 확인에 따라 조정될 수 있습니다.
            </p>
            <div className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              <p>견적안 번호: {proposal.proposalNumber}</p>
              <p>작성일: {formatDate(proposal.createdAt)}</p>
              <p>유효일: {formatDate(proposal.validUntil)}</p>
              <p>표시: {proposal.vatIncluded ? "부가세 포함" : "부가세 별도 계산"}</p>
            </div>
          </header>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-md border border-line bg-ivory p-4">
              <h2 className="text-base font-black text-ink">고객 정보</h2>
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
            <div className="rounded-md border border-line bg-ivory p-4">
              <h2 className="text-base font-black text-ink">제작 사양</h2>
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
            <h2 className="text-lg font-black text-ink">사양 요약</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
              {proposal.specificationSummary ?? "-"}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-black text-ink">견적 항목</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[720px] w-full border-collapse text-sm">
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
            </div>
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

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-black text-ink">납기 안내</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
                {proposal.deliveryEstimateText ?? "상담 후 안내드립니다."}
              </p>
            </div>
            <div>
              <h2 className="text-lg font-black text-ink">결제 조건</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
                {proposal.paymentTerms ?? "상담 후 안내드립니다."}
              </p>
            </div>
          </section>

          <footer className="mt-10 rounded-md border border-line bg-ivory p-4 text-sm leading-7 text-neutral-700">
            <p>{quoteDisclaimer}</p>
            {proposal.customerMessage ? <p className="mt-3 whitespace-pre-wrap">{proposal.customerMessage}</p> : null}
          </footer>
        </div>

        <div className="mt-6">
          {existingResponse ? (
            <div className="rounded-lg border border-line bg-white p-5">
              <h2 className="text-xl font-black text-ink">견적안 응답이 접수되었습니다.</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                접수된 응답:{" "}
                {QUOTE_CUSTOMER_RESPONSE_LABELS[existingResponse.responseType as QuoteCustomerResponseType] ??
                  existingResponse.responseType}
              </p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                추가 확인이 필요하면 페르패키지 담당자에게 다시 문의해 주세요.
              </p>
            </div>
          ) : (
            <QuoteShareResponseForm token={token} />
          )}
        </div>
      </section>
    </main>
  );
}
