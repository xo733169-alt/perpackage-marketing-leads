import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { QuoteProposalForm, type QuoteProposalFormValue } from "@/components/QuoteProposalForm";
import { isAdminAuthenticated } from "@/lib/auth";
import { type QuoteProposalStatus } from "@/lib/quote-proposal-schema";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDateInput(value: Date | null) {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
}

export default async function QuoteProposalEditPage({ params }: { params: { id: string } }) {
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

  const initialValue: QuoteProposalFormValue = {
    leadId: proposal.leadId ?? "",
    status: proposal.status as QuoteProposalStatus,
    title: proposal.title,
    customerNameSnapshot: proposal.customerNameSnapshot,
    companyNameSnapshot: proposal.companyNameSnapshot ?? "",
    phoneSnapshot: proposal.phoneSnapshot ?? "",
    emailSnapshot: proposal.emailSnapshot ?? "",
    kakaoIdSnapshot: proposal.kakaoIdSnapshot ?? "",
    boxType: proposal.boxType,
    industry: proposal.industry,
    quantityLabel: proposal.quantityLabel ?? "",
    quantityCount: proposal.quantityCount?.toString() ?? "",
    specificationSummary: proposal.specificationSummary ?? "",
    productionNotes: proposal.productionNotes ?? "",
    deliveryEstimateText: proposal.deliveryEstimateText ?? "",
    paymentTerms: proposal.paymentTerms ?? "",
    validUntil: formatDateInput(proposal.validUntil),
    vatIncluded: proposal.vatIncluded,
    customerMessage: proposal.customerMessage ?? "",
    internalMemo: proposal.internalMemo ?? "",
    basedOnEstimateLabel: proposal.basedOnEstimateLabel ?? "",
    basedOnUnitPriceMinKrw: proposal.basedOnUnitPriceMinKrw?.toString() ?? "",
    basedOnUnitPriceMaxKrw: proposal.basedOnUnitPriceMaxKrw?.toString() ?? "",
    basedOnTotalPriceMinKrw: proposal.basedOnTotalPriceMinKrw?.toString() ?? "",
    basedOnTotalPriceMaxKrw: proposal.basedOnTotalPriceMaxKrw?.toString() ?? "",
    items: proposal.items.map((item) => ({
      id: item.id,
      sortOrder: item.sortOrder,
      itemName: item.itemName,
      description: item.description ?? "",
      quantity: item.quantity.toString(),
      unitPriceKrw: item.unitPriceKrw.toString()
    }))
  };

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-proposals" />
          <div>
            <p className="text-sm font-bold text-brass">견적안 편집</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{proposal.proposalNumber}</h1>
          </div>
        </div>
        <div className="mt-8">
          <QuoteProposalForm mode="edit" proposalId={proposal.id} initialValue={initialValue} />
        </div>
      </section>
    </main>
  );
}
