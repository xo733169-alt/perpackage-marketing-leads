import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { QuoteCalculatorClient } from "@/components/QuoteCalculatorClient";
import { isAdminAuthenticated } from "@/lib/auth";
import { DEFAULT_QUOTE_RULES } from "@/lib/default-quote-rules";
import { FINISHING_OPTION_OPTIONS } from "@/lib/lead-options";
import { toQuoteRuleConfig } from "@/lib/quote-rule-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function parseFinishingFromQuery(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : value ?? "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is (typeof FINISHING_OPTION_OPTIONS)[number] =>
      FINISHING_OPTION_OPTIONS.includes(item as (typeof FINISHING_OPTION_OPTIONS)[number])
    );
}

export default async function AdminQuoteCalculatorPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const rulesFromDb = await prisma.quoteRule.findMany({
    where: { isActive: true },
    orderBy: [{ boxType: "asc" }, { quantityRange: "asc" }, { updatedAt: "desc" }]
  });
  const rules = rulesFromDb.length ? rulesFromDb.map(toQuoteRuleConfig) : DEFAULT_QUOTE_RULES;

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-calculator" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">견적 계산기</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-600">
              리드를 만들지 않고 참고 견적 엔진을 테스트하는 내부 도구입니다. 고객에게 확정 견적으로 전달하면 안 됩니다.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <QuoteCalculatorClient
            rules={rules}
            initialValue={{
              boxType: typeof searchParams?.boxType === "string" ? searchParams.boxType : "",
              quantityRange: typeof searchParams?.quantityRange === "string" ? searchParams.quantityRange : "",
              widthMm: typeof searchParams?.widthMm === "string" ? searchParams.widthMm : "",
              depthMm: typeof searchParams?.depthMm === "string" ? searchParams.depthMm : "",
              heightMm: typeof searchParams?.heightMm === "string" ? searchParams.heightMm : "",
              printOption: typeof searchParams?.printOption === "string" ? searchParams.printOption : "",
              finishingOptions: parseFinishingFromQuery(searchParams?.finishingOptions)
            }}
          />
        </div>
      </section>
    </main>
  );
}
