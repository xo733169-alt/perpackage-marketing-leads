import Link from "next/link";
import { redirect } from "next/navigation";
import { PortfolioCaseForm } from "@/components/PortfolioCaseForm";
import { isAdminAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function NewPortfolioCasePage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="border-b border-line pb-6">
          <Link href="/admin/portfolio" className="text-sm font-semibold text-neutral-600 hover:text-ink">
            제작 사례 목록으로 돌아가기
          </Link>
          <h1 className="mt-3 text-3xl font-black text-ink">제작 사례 등록</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            고객사명, 제품 정보, 이미지, 제작 사양의 공개 가능 여부를 확인한 뒤 공개하세요. 임시저장은 승인 없이 가능합니다.
          </p>
        </div>
        <div className="mt-8">
          <PortfolioCaseForm mode="create" />
        </div>
      </section>
    </main>
  );
}
