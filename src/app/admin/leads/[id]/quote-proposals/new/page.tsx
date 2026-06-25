import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { QuoteProposalForm, type QuoteProposalFormValue } from "@/components/QuoteProposalForm";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  buildDefaultProposalItemFromLead,
  buildSpecificationSummaryFromLead,
  getRepresentativeQuantityFromRange
} from "@/lib/quote-proposal";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

export default async function NewQuoteProposalFromLeadPage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const lead = await prisma.lead.findUnique({
    where: { id: params.id }
  });

  if (!lead) {
    notFound();
  }

  const defaultItem = buildDefaultProposalItemFromLead(lead);
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 14);

  const initialValue: QuoteProposalFormValue = {
    leadId: lead.id,
    status: "DRAFT",
    title: `${lead.customerName} ${lead.boxType} 견적안`,
    customerNameSnapshot: lead.customerName,
    companyNameSnapshot: lead.companyName ?? "",
    phoneSnapshot: lead.phone ?? "",
    emailSnapshot: lead.email ?? "",
    kakaoIdSnapshot: lead.kakaoId ?? "",
    boxType: lead.boxType,
    industry: lead.industry,
    quantityLabel: lead.quantityRange,
    quantityCount: (getRepresentativeQuantityFromRange(lead.quantityRange) ?? "").toString(),
    specificationSummary: buildSpecificationSummaryFromLead(lead),
    productionNotes: "",
    deliveryEstimateText: "상세 사양 확정 후 납기 일정을 안내드립니다.",
    paymentTerms: "세부 결제 조건은 상담 후 안내드립니다.",
    validUntil: toDateInput(validUntil),
    vatIncluded: false,
    customerMessage:
      "문의 주신 제작 사양을 기준으로 작성한 견적안입니다. 최종 제작 조건, 원자재, 후가공, 일정 확인에 따라 조정될 수 있습니다.",
    internalMemo: "",
    basedOnEstimateLabel: lead.estimateLabel ?? lead.estimatedPriceRange ?? "",
    basedOnUnitPriceMinKrw: lead.estimatedUnitPriceMinKrw?.toString() ?? "",
    basedOnUnitPriceMaxKrw: lead.estimatedUnitPriceMaxKrw?.toString() ?? "",
    basedOnTotalPriceMinKrw: lead.estimatedTotalPriceMinKrw?.toString() ?? "",
    basedOnTotalPriceMaxKrw: lead.estimatedTotalPriceMaxKrw?.toString() ?? "",
    items: [
      {
        sortOrder: 0,
        itemName: defaultItem.itemName,
        description: defaultItem.description ?? "",
        quantity: String(defaultItem.quantity),
        unitPriceKrw: String(defaultItem.unitPriceKrw)
      }
    ]
  };

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-proposals" />
          <div>
            <p className="text-sm font-bold text-brass">견적안 작성</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{lead.customerName} 문의 견적안</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              이 견적안은 관리자 검토 후 작성하는 내부 견적안입니다. 자동 예상 범위와 실제 견적은 다를 수 있습니다.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <QuoteProposalForm mode="create" initialValue={initialValue} />
        </div>
      </section>
    </main>
  );
}
