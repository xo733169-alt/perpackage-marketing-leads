import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { QuoteRuleForm, type QuoteRuleFormValue } from "@/components/QuoteRuleForm";
import { isAdminAuthenticated } from "@/lib/auth";
import { QUOTE_RULE_CHANGE_TYPE_LABELS, type QuoteRuleChangeType } from "@/lib/quote-rule-log";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toFormValue(rule: Awaited<ReturnType<typeof prisma.quoteRule.findUnique>>): QuoteRuleFormValue {
  if (!rule) {
    throw new Error("Quote rule is required.");
  }

  return {
    name: rule.name,
    isActive: rule.isActive,
    boxType: rule.boxType,
    quantityRange: rule.quantityRange,
    minQuantity: rule.minQuantity?.toString() ?? "",
    maxQuantity: rule.maxQuantity?.toString() ?? "",
    baseUnitPriceMinKrw: rule.baseUnitPriceMinKrw.toString(),
    baseUnitPriceMaxKrw: rule.baseUnitPriceMaxKrw.toString(),
    sizeSmallThreshold: rule.sizeSmallThreshold.toString(),
    sizeMediumThreshold: rule.sizeMediumThreshold.toString(),
    sizeLargeThreshold: rule.sizeLargeThreshold.toString(),
    smallSizeMultiplier: rule.smallSizeMultiplier.toString(),
    mediumSizeMultiplier: rule.mediumSizeMultiplier.toString(),
    largeSizeMultiplier: rule.largeSizeMultiplier.toString(),
    extraLargeSizeMultiplier: rule.extraLargeSizeMultiplier.toString(),
    printNoneMultiplier: rule.printNoneMultiplier.toString(),
    printOneColorMultiplier: rule.printOneColorMultiplier.toString(),
    printFullColorMultiplier: rule.printFullColorMultiplier.toString(),
    printFoilEmbossMultiplier: rule.printFoilEmbossMultiplier.toString(),
    finishingBaseAddMinKrw: rule.finishingBaseAddMinKrw.toString(),
    finishingBaseAddMaxKrw: rule.finishingBaseAddMaxKrw.toString(),
    complexityLowMultiplier: rule.complexityLowMultiplier.toString(),
    complexityNormalMultiplier: rule.complexityNormalMultiplier.toString(),
    complexityHighMultiplier: rule.complexityHighMultiplier.toString(),
    complexityVeryHighMultiplier: rule.complexityVeryHighMultiplier.toString(),
    minOrderPriceKrw: rule.minOrderPriceKrw.toString(),
    notes: rule.notes ?? "",
    changeReason: ""
  };
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "short", timeStyle: "short" }).format(value);
}

export default async function EditQuoteRulePage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const [quoteRule, logs] = await Promise.all([
    prisma.quoteRule.findUnique({
      where: { id: params.id }
    }),
    prisma.quoteRuleChangeLog.findMany({
      where: { quoteRuleId: params.id },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  if (!quoteRule) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-rules" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">{quoteRule.name}</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              룰을 삭제하기보다 비활성화하면 기존 기록을 유지하면서 계산에서 제외할 수 있습니다.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <QuoteRuleForm mode="edit" quoteRuleId={quoteRule.id} initialValue={toFormValue(quoteRule)} />
        </div>
        <section className="mt-8 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-bold text-ink">변경 이력</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[720px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold text-charcoal">
                <tr>
                  <th className="px-4 py-3">변경일</th>
                  <th className="px-4 py-3">변경 유형</th>
                  <th className="px-4 py-3">변경 사유</th>
                  <th className="px-4 py-3">변경자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                      아직 변경 이력이 없습니다.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-4 py-3">{formatDate(log.createdAt)}</td>
                      <td className="px-4 py-3">
                        {QUOTE_RULE_CHANGE_TYPE_LABELS[log.changeType as QuoteRuleChangeType] ?? log.changeType}
                      </td>
                      <td className="px-4 py-3">{log.changeReason || "-"}</td>
                      <td className="px-4 py-3">{log.changedBy || "-"}</td>
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
