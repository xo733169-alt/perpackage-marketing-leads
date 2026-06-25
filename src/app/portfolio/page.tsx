import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PortfolioCaseImage } from "@/components/PortfolioCaseImage";
import {
  PORTFOLIO_INDUSTRY_OPTIONS,
  PORTFOLIO_PACKAGE_TYPE_OPTIONS,
  PORTFOLIO_PURPOSE_OPTIONS,
  PORTFOLIO_STRUCTURE_OPTIONS
} from "@/lib/portfolio-options";
import {
  buildPortfolioCaseWhere,
  getPortfolioCaseUrl,
  getPortfolioImageAlt,
  normalizePortfolioFilterValue,
  parseStringList,
} from "@/lib/portfolio-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "제작 사례 | 페르패키지",
  description: "싸바리박스, 자석박스, 상하짝박스, 서랍형박스 등 페르패키지의 맞춤 패키지 제작 사례를 확인해보세요.",
  openGraph: {
    title: "제작 사례 | 페르패키지",
    description: "싸바리박스, 자석박스, 상하짝박스, 서랍형박스 등 페르패키지의 맞춤 패키지 제작 사례를 확인해보세요.",
    locale: "ko_KR",
    siteName: "페르패키지",
    type: "website"
  }
};

const sortOptions = [
  { value: "latest", label: "최신순" },
  { value: "featured", label: "추천순" },
  { value: "title", label: "제목순" }
] as const;

function buildOrderBy(sort: string): Prisma.PortfolioCaseOrderByWithRelationInput[] {
  if (sort === "featured") {
    return [{ featured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }];
  }

  if (sort === "title") {
    return [{ title: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }];
  }

  return [{ publishedAt: "desc" }, { createdAt: "desc" }];
}

export default async function PortfolioPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const q = typeof searchParams?.q === "string" ? searchParams.q.trim() : "";
  const packageTypeParam = typeof searchParams?.packageType === "string" ? searchParams.packageType : "";
  const legacyBoxTypeParam = typeof searchParams?.boxType === "string" ? searchParams.boxType : "";
  const industryParam = typeof searchParams?.industry === "string" ? searchParams.industry : "";
  const packageStructureParam = typeof searchParams?.packageStructure === "string" ? searchParams.packageStructure : "";
  const casePurposeParam = typeof searchParams?.casePurpose === "string" ? searchParams.casePurpose : "";
  const sort = typeof searchParams?.sort === "string" ? searchParams.sort : "latest";
  const packageType = normalizePortfolioFilterValue(packageTypeParam || legacyBoxTypeParam, PORTFOLIO_PACKAGE_TYPE_OPTIONS);
  const industry = normalizePortfolioFilterValue(industryParam, PORTFOLIO_INDUSTRY_OPTIONS);
  const packageStructure = normalizePortfolioFilterValue(packageStructureParam, PORTFOLIO_STRUCTURE_OPTIONS);
  const casePurpose = normalizePortfolioFilterValue(casePurposeParam, PORTFOLIO_PURPOSE_OPTIONS);
  const where = buildPortfolioCaseWhere(searchParams, { publicOnly: true });

  const cases = await prisma.portfolioCase.findMany({
    where,
    orderBy: buildOrderBy(sort)
  });

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="section-shell flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="text-lg font-black text-ink">
            페르패키지
          </Link>
          <Link
            href="/#quote"
            className="focus-ring rounded-md bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
          >
            견적 문의하기
          </Link>
        </div>
      </header>

      <section className="section-shell py-14">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-brass">PORTFOLIO</p>
          <h1 className="mt-3 text-4xl font-black text-ink [word-break:keep-all]">제작 사례</h1>
          <p className="mt-5 text-lg leading-8 text-neutral-700">
            제품과 비슷한 제작 사례를 찾아보세요. 패키지 종류, 업종, 구조, 사용 목적에 따라 확인할 수 있습니다.
          </p>
        </div>

        <form className="mt-8 grid gap-3 rounded-lg border border-line bg-white p-4 md:grid-cols-2 xl:grid-cols-[1fr_160px_160px_160px_170px_130px_auto_auto]">
          <label className="block">
            <span className="label-base">검색</span>
            <input name="q" defaultValue={q} placeholder="제목, 설명, 태그" className="input-base mt-2" />
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
            <span className="label-base">정렬</span>
            <select name="sort" defaultValue={sort} className="input-base mt-2">
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="focus-ring min-h-11 w-full rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
            >
              적용
            </button>
          </div>
          <div className="flex items-end">
            <Link
              href="/portfolio"
              className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:border-ink"
            >
              필터 초기화
            </Link>
          </div>
        </form>

        {cases.length === 0 ? (
          <div className="mt-10 rounded-lg border border-line bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-ink">조건에 맞는 제작 사례가 없습니다.</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              다른 조건으로 다시 확인하시거나, 원하는 패키지 형태를 문의해 주세요.
            </p>
            <Link
              href="/#quote"
              className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
            >
              견적 문의하기
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cases.map((caseItem) => {
              const tags = parseStringList(caseItem.tags).slice(0, 4);

              return (
                <article key={caseItem.id} className="rounded-lg border border-line bg-white p-4 shadow-sm">
                  <PortfolioCaseImage src={caseItem.mainImageUrl} alt={getPortfolioImageAlt(caseItem)} />
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2 text-xs font-bold text-brass">
                      <span>{caseItem.industry}</span>
                      <span>{caseItem.boxType}</span>
                      {caseItem.packageStructure ? <span>{caseItem.packageStructure}</span> : null}
                      {caseItem.casePurpose ? <span>{caseItem.casePurpose}</span> : null}
                    </div>
                    <h2 className="mt-3 text-xl font-black leading-7 text-ink [word-break:keep-all]">{caseItem.title}</h2>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-neutral-700">{caseItem.shortDescription}</p>
                    {tags.length ? (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-ivory px-2.5 py-1 text-xs font-semibold text-charcoal">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <Link
                      href={getPortfolioCaseUrl(caseItem.slug)}
                      className="focus-ring mt-5 inline-flex min-h-10 items-center justify-center rounded-md border border-ink bg-white px-4 py-2 text-sm font-bold text-ink transition hover:bg-ivory"
                    >
                      자세히 보기
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-14 rounded-lg border border-line bg-ink p-7 text-white">
          <h2 className="text-2xl font-black [word-break:keep-all]">비슷한 패키지를 제작하고 싶으신가요?</h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            원하는 박스 종류와 제작 수량을 알려주시면 사양 확인 후 상담을 도와드립니다.
          </p>
          <Link
            href="/#quote"
            className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ivory"
          >
            견적 문의하기
          </Link>
        </section>
      </section>
    </main>
  );
}
