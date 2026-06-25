import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PortfolioCaseForm } from "@/components/PortfolioCaseForm";
import { isAdminAuthenticated } from "@/lib/auth";
import { isPortfolioStatus } from "@/lib/portfolio-options";
import { parseStringList } from "@/lib/portfolio-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EditPortfolioCasePage({ params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const caseItem = await prisma.portfolioCase.findUnique({
    where: { id: params.id }
  });

  if (!caseItem) {
    notFound();
  }

  const status = isPortfolioStatus(caseItem.status) ? caseItem.status : "DRAFT";

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="border-b border-line pb-6">
          <Link href="/admin/portfolio" className="text-sm font-semibold text-neutral-600 hover:text-ink">
            제작 사례 목록으로 돌아가기
          </Link>
          <h1 className="mt-3 text-3xl font-black text-ink">{caseItem.title}</h1>
          <p className="mt-3 text-sm leading-6 text-neutral-600">
            공개 전 고객사명, 제품 정보, 이미지 사용 허가, 민감한 사양 노출 여부를 다시 확인하세요.
          </p>
          {caseItem.publicApprovedAt ? (
            <p className="mt-2 text-xs font-semibold text-emerald-700">
              공개 승인 확인일: {new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(caseItem.publicApprovedAt)}
            </p>
          ) : null}
        </div>
        <div className="mt-8">
          <PortfolioCaseForm
            mode="edit"
            caseId={caseItem.id}
            initialValue={{
              title: caseItem.title,
              slug: caseItem.slug,
              status,
              featured: caseItem.featured,
              sortOrder: String(caseItem.sortOrder),
              industry: caseItem.industry,
              boxType: caseItem.boxType,
              packageStructure: caseItem.packageStructure ?? "",
              casePurpose: caseItem.casePurpose ?? "",
              productName: caseItem.productName ?? "",
              clientName: caseItem.clientName ?? "",
              isClientNamePublic: caseItem.isClientNamePublic,
              quantityRange: caseItem.quantityRange ?? "",
              widthMm: caseItem.widthMm ? String(caseItem.widthMm) : "",
              depthMm: caseItem.depthMm ? String(caseItem.depthMm) : "",
              heightMm: caseItem.heightMm ? String(caseItem.heightMm) : "",
              paperType: caseItem.paperType ?? "",
              boardThickness: caseItem.boardThickness ?? "",
              printOption: caseItem.printOption ?? "",
              finishingOptions: parseStringList(caseItem.finishingOptions),
              mainImageUrl: caseItem.mainImageUrl ?? "",
              mainImageAlt: caseItem.mainImageAlt ?? "",
              imageCaption: caseItem.imageCaption ?? "",
              imageUrlsText: parseStringList(caseItem.imageUrls).join("\n"),
              shortDescription: caseItem.shortDescription,
              projectOverview: caseItem.projectOverview ?? "",
              productionPoint: caseItem.productionPoint ?? "",
              specificationSummary: caseItem.specificationSummary ?? "",
              seoTitle: caseItem.seoTitle ?? "",
              seoDescription: caseItem.seoDescription ?? "",
              tagsText: parseStringList(caseItem.tags).join(", "),
              publicApprovalConfirmed: caseItem.publicApprovalConfirmed,
              publicApprovalMemo: caseItem.publicApprovalMemo ?? "",
              publicApprovalBy: caseItem.publicApprovalBy ?? ""
            }}
          />
        </div>
      </section>
    </main>
  );
}
