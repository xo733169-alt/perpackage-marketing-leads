import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { QuoteRuleForm } from "@/components/QuoteRuleForm";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function NewQuoteRulePage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/quote-rules" />
          <div>
            <p className="text-sm font-bold text-brass">관리자</p>
            <h1 className="mt-2 text-3xl font-black text-ink">견적 룰 추가</h1>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              입력한 룰은 참고 견적 계산에 사용됩니다. 운영 전 실제 제작 기준과 단가를 반드시 검토하세요.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <QuoteRuleForm mode="create" />
        </div>
      </section>
    </main>
  );
}
