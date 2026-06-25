import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  isPortfolioSeoStatus,
  PORTFOLIO_INDUSTRY_OPTIONS,
  PORTFOLIO_PACKAGE_TYPE_OPTIONS,
  PORTFOLIO_PURPOSE_OPTIONS,
  PORTFOLIO_SEO_STATUSES,
  PORTFOLIO_SEO_STATUS_LABELS,
  PORTFOLIO_STRUCTURE_OPTIONS,
  PORTFOLIO_STATUSES,
  PORTFOLIO_STATUS_LABELS
} from "@/lib/portfolio-options";
import { getPortfolioSeoStatus } from "@/lib/portfolio-seo";
import {
  buildPortfolioCaseWhere,
  getPortfolioCaseUrl,
  isPublishedPortfolioCase,
  normalizePortfolioFilterValue
} from "@/lib/portfolio-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(value);
}

function getStatusClass(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ARCHIVED":
      return "border-neutral-200 bg-neutral-50 text-neutral-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function getSeoStatusClass(status: string) {
  switch (status) {
    case "GOOD":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "MISSING_REQUIRED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

export default async function AdminPortfolioPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  const q = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const status = typeof searchParams?.status === "string" ? searchParams.status : "";
  const packageTypeParam = typeof searchParams?.packageType === "string" ? searchParams.packageType : "";
  const legacyBoxTypeParam = typeof searchParams?.boxType === "string" ? searchParams.boxType : "";
  const industryParam = typeof searchParams?.industry === "string" ? searchParams.industry : "";
  const packageStructureParam = typeof searchParams?.packageStructure === "string" ? searchParams.packageStructure : "";
  const casePurposeParam = typeof searchParams?.casePurpose === "string" ? searchParams.casePurpose : "";
  const seo = typeof searchParams?.seo === "string" ? searchParams.seo : "";
  const packageType = normalizePortfolioFilterValue(packageTypeParam || legacyBoxTypeParam, PORTFOLIO_PACKAGE_TYPE_OPTIONS);
  const industry = normalizePortfolioFilterValue(industryParam, PORTFOLIO_INDUSTRY_OPTIONS);
  const packageStructure = normalizePortfolioFilterValue(packageStructureParam, PORTFOLIO_STRUCTURE_OPTIONS);
  const casePurpose = normalizePortfolioFilterValue(casePurposeParam, PORTFOLIO_PURPOSE_OPTIONS);
  const where = buildPortfolioCaseWhere(searchParams, { includeStatus: true });

  const casesFromDb = await prisma.portfolioCase.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 100
  });

  const cases = isPortfolioSeoStatus(seo)
    ? casesFromDb.filter((caseItem) => getPortfolioSeoStatus(caseItem) === seo)
    : casesFromDb;

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-8">
        <div className="flex flex-col gap-4 border-b border-line pb-6">
          <AdminNav currentPath="/admin/portfolio" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-brass">관리자</p>
              <h1 className="mt-2 text-3xl font-black text-ink">제작 사례 관리</h1>
            </div>
            <Link
              href="/admin/portfolio/new"
              className="focus-ring w-fit rounded-md bg-ink px-4 py-3 text-sm font-bold text-white transition hover:bg-charcoal"
            >
              제작 사례 등록
            </Link>
          </div>
        </div>

        <form className="mt-6 grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-2 xl:grid-cols-[1fr_140px_150px_150px_150px_150px_130px_auto]">
          <label className="block">
            <span className="label-base">검색</span>
            <input
              name="q"
              defaultValue={q}
              placeholder="제목, 업종, 박스 종류, 제품명, 고객사명"
              className="input-base mt-2"
            />
          </label>
          <label className="block">
            <span className="label-base">상태</span>
            <select name="status" defaultValue={status} className="input-base mt-2">
              <option value="">전체</option>
              {PORTFOLIO_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {PORTFOLIO_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">패키지 종류</span>
            <select name="packageType" defaultValue={packageType} className="input-base mt-2">
              <option value="">전체</option>
              {PORTFOLIO_PACKAGE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">업종</span>
            <select name="industry" defaultValue={industry} className="input-base mt-2">
              <option value="">전체</option>
              {PORTFOLIO_INDUSTRY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">패키지 구조</span>
            <select name="packageStructure" defaultValue={packageStructure} className="input-base mt-2">
              <option value="">전체</option>
              {PORTFOLIO_STRUCTURE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">제작 목적</span>
            <select name="casePurpose" defaultValue={casePurpose} className="input-base mt-2">
              <option value="">전체</option>
              {PORTFOLIO_PURPOSE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label-base">SEO 상태</span>
            <select name="seo" defaultValue={seo} className="input-base mt-2">
              <option value="">전체</option>
              {PORTFOLIO_SEO_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {PORTFOLIO_SEO_STATUS_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="focus-ring min-h-11 w-full rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
            >
              적용
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1660px] w-full border-collapse text-left text-sm">
              <thead className="bg-ivory text-xs font-bold uppercase text-charcoal">
                <tr>
                  <th className="px-4 py-3 [white-space:nowrap]">제목</th>
                  <th className="px-4 py-3 [white-space:nowrap]">상태</th>
                  <th className="px-4 py-3 [white-space:nowrap]">공개 승인</th>
                  <th className="px-4 py-3 [white-space:nowrap]">SEO 상태</th>
                  <th className="px-4 py-3 [white-space:nowrap]">업종</th>
                  <th className="px-4 py-3 [white-space:nowrap]">박스 종류</th>
                  <th className="px-4 py-3 [white-space:nowrap]">구조</th>
                  <th className="px-4 py-3 [white-space:nowrap]">제작 목적</th>
                  <th className="px-4 py-3 [white-space:nowrap]">대표 이미지</th>
                  <th className="px-4 py-3 [white-space:nowrap]">추천</th>
                  <th className="px-4 py-3 [white-space:nowrap]">공개일</th>
                  <th className="px-4 py-3 [white-space:nowrap]">수정일</th>
                  <th className="px-4 py-3 [white-space:nowrap]">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {cases.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-10 text-center text-neutral-500">
                      조건에 맞는 제작 사례가 없습니다.
                    </td>
                  </tr>
                ) : (
                  cases.map((caseItem) => {
                    const seoStatus = getPortfolioSeoStatus(caseItem);
                    const isPublicVisible = isPublishedPortfolioCase(caseItem);

                    return (
                      <tr key={caseItem.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-bold text-ink">{caseItem.title}</p>
                          <p className="mt-1 text-xs text-neutral-500">{caseItem.slug}</p>
                        </td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusClass(caseItem.status)}`}>
                            {PORTFOLIO_STATUS_LABELS[caseItem.status as keyof typeof PORTFOLIO_STATUS_LABELS] ?? caseItem.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <span
                            className={
                              caseItem.publicApprovalConfirmed
                                ? "inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                                : "inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"
                            }
                          >
                            {caseItem.publicApprovalConfirmed ? "승인됨" : "미승인"}
                          </span>
                        </td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getSeoStatusClass(seoStatus)}`}>
                            {PORTFOLIO_SEO_STATUS_LABELS[seoStatus]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{caseItem.industry}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{caseItem.boxType}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{caseItem.packageStructure || "미입력"}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{caseItem.casePurpose || "미입력"}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{caseItem.mainImageUrl ? "있음" : "placeholder"}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{caseItem.featured ? "추천" : "-"}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{formatDate(caseItem.publishedAt)}</td>
                        <td className="px-4 py-3 text-neutral-700 [white-space:nowrap]">{formatDate(caseItem.updatedAt)}</td>
                        <td className="px-4 py-3 [white-space:nowrap]">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/portfolio/${caseItem.id}/edit`}
                              className="focus-ring rounded-md border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
                            >
                              편집
                            </Link>
                            {isPublicVisible ? (
                              <Link
                                href={getPortfolioCaseUrl(caseItem.slug)}
                                className="focus-ring rounded-md border border-line bg-ivory px-3 py-2 text-xs font-semibold text-ink transition hover:border-ink"
                              >
                                공개 페이지 보기
                              </Link>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
