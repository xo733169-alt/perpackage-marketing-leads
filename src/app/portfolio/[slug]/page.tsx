import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PortfolioCaseImage } from "@/components/PortfolioCaseImage";
import {
  getPortfolioClientLabel,
  getPortfolioImageAlt,
  getPortfolioQuoteUrl,
  getPortfolioSizeLabel,
  parseStringList,
  PUBLIC_PORTFOLIO_WHERE
} from "@/lib/portfolio-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { slug: string };
};

async function getPublicCase(slug: string) {
  return prisma.portfolioCase.findFirst({
    where: {
      ...PUBLIC_PORTFOLIO_WHERE,
      slug
    }
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const caseItem = await getPublicCase(params.slug);

  if (!caseItem) {
    return {
      title: "제작 사례를 찾을 수 없습니다 | 페르패키지"
    };
  }

  const title = caseItem.seoTitle || `${caseItem.title} | 페르패키지`;
  const description = caseItem.seoDescription || caseItem.shortDescription;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      locale: "ko_KR",
      siteName: "페르패키지",
      type: "article",
      images: caseItem.mainImageUrl
        ? [{ url: caseItem.mainImageUrl, alt: getPortfolioImageAlt(caseItem) }]
        : undefined
    }
  };
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="border-b border-line py-3 last:border-b-0">
      <dt className="text-xs font-bold text-neutral-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-6 text-ink">{value || "-"}</dd>
    </div>
  );
}

export default async function PortfolioDetailPage({ params }: PageProps) {
  const caseItem = await getPublicCase(params.slug);

  if (!caseItem) {
    notFound();
  }

  const tags = parseStringList(caseItem.tags);
  const finishingOptions = parseStringList(caseItem.finishingOptions);
  const imageUrls = parseStringList(caseItem.imageUrls);
  const quoteUrl = getPortfolioQuoteUrl(caseItem);
  const kakaoUrl = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
  const canonicalUrl = `${siteUrl}/portfolio/${caseItem.slug}`;
  const imageAlt = getPortfolioImageAlt(caseItem);
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "홈", item: siteUrl },
          { "@type": "ListItem", position: 2, name: "제작 사례", item: `${siteUrl}/portfolio` },
          { "@type": "ListItem", position: 3, name: caseItem.title, item: canonicalUrl }
        ]
      },
      {
        "@type": "CreativeWork",
        name: caseItem.title,
        description: caseItem.seoDescription || caseItem.shortDescription,
        image: caseItem.mainImageUrl || undefined,
        publisher: {
          "@type": "Organization",
          name: "페르패키지"
        }
      }
    ]
  };

  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="section-shell flex min-h-16 items-center justify-between gap-4">
          <Link href="/" className="text-lg font-black text-ink">
            페르패키지
          </Link>
          <Link
            href={quoteUrl}
            className="focus-ring rounded-md bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
          >
            비슷한 패키지 견적 문의하기
          </Link>
        </div>
      </header>

      <article className="section-shell py-12">
        <Link href="/portfolio" className="text-sm font-semibold text-neutral-600 hover:text-ink">
          제작 사례 목록으로 돌아가기
        </Link>

        <section className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <PortfolioCaseImage src={caseItem.mainImageUrl} alt={imageAlt} className="shadow-soft" />
            {caseItem.imageCaption ? (
              <p className="mt-3 text-sm leading-6 text-neutral-600">{caseItem.imageCaption}</p>
            ) : null}
          </div>
          <div>
            <div className="flex flex-wrap gap-2 text-xs font-bold text-brass">
              <span>{caseItem.industry}</span>
              <span>{caseItem.boxType}</span>
              {caseItem.packageStructure ? <span>{caseItem.packageStructure}</span> : null}
              {caseItem.casePurpose ? <span>{caseItem.casePurpose}</span> : null}
            </div>
            <h1 className="mt-4 text-4xl font-black leading-tight text-ink [word-break:keep-all]">{caseItem.title}</h1>
            <p className="mt-5 text-lg leading-8 text-neutral-700">{caseItem.shortDescription}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href={quoteUrl}
                className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-charcoal"
              >
                비슷한 패키지 견적 문의하기
              </Link>
              {kakaoUrl ? (
                <a
                  href={kakaoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-ink bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-ivory"
                >
                  카카오톡으로 상담하기
                </a>
              ) : (
                <span className="inline-flex min-h-12 items-center justify-center rounded-md border border-line bg-white px-6 py-3 text-sm font-semibold text-neutral-500">
                  카카오톡 채널 링크가 아직 설정되지 않았습니다.
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <aside className="rounded-lg border border-line bg-white p-5">
            <h2 className="text-lg font-bold text-ink">제작 사양</h2>
            <dl className="mt-4">
              <DetailRow label="브랜드" value={getPortfolioClientLabel(caseItem)} />
              <DetailRow label="업종" value={caseItem.industry} />
              <DetailRow label="박스 종류" value={caseItem.boxType} />
              <DetailRow label="패키지 구조" value={caseItem.packageStructure} />
              <DetailRow label="제작 목적" value={caseItem.casePurpose} />
              <DetailRow label="제품명" value={caseItem.productName} />
              <DetailRow label="제작 수량" value={caseItem.quantityRange} />
              <DetailRow label="사이즈" value={getPortfolioSizeLabel(caseItem)} />
              <DetailRow label="사용 지류" value={caseItem.paperType} />
              <DetailRow label="보드 두께" value={caseItem.boardThickness} />
              <DetailRow label="인쇄 사양" value={caseItem.printOption} />
              <DetailRow label="후가공" value={finishingOptions.length ? finishingOptions.join(", ") : "-"} />
            </dl>
          </aside>

          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-white p-6">
              <h2 className="text-2xl font-black text-ink">프로젝트 개요</h2>
              <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-neutral-700">
                {caseItem.projectOverview || caseItem.shortDescription}
              </p>
            </section>
            <section className="rounded-lg border border-line bg-white p-6">
              <h2 className="text-2xl font-black text-ink">제작 포인트</h2>
              <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-neutral-700">
                {caseItem.productionPoint || "제품 특성과 브랜드 방향에 맞춰 구조, 소재, 인쇄, 후가공 조건을 검토했습니다."}
              </p>
            </section>
            <section className="rounded-lg border border-line bg-white p-6">
              <h2 className="text-2xl font-black text-ink">사양 요약</h2>
              <p className="mt-4 whitespace-pre-wrap text-base leading-8 text-neutral-700">
                {caseItem.specificationSummary || "세부 사양은 상담 과정에서 확인 후 안내드립니다."}
              </p>
            </section>
          </div>
        </section>

        {imageUrls.length ? (
          <section className="mt-10">
            <h2 className="text-2xl font-black text-ink">추가 이미지</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {imageUrls.map((imageUrl, index) => (
                <PortfolioCaseImage key={imageUrl} src={imageUrl} alt={`${caseItem.title} 추가 이미지 ${index + 1}`} />
              ))}
            </div>
          </section>
        ) : null}

        {tags.length ? (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-ivory px-3 py-1.5 text-xs font-bold text-charcoal">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <section className="mt-12 rounded-lg border border-line bg-ink p-7 text-white">
          <h2 className="text-2xl font-black [word-break:keep-all]">비슷한 패키지 견적이 필요하신가요?</h2>
          <p className="mt-3 text-sm leading-6 text-white/75">
            이 제작 사례와 비슷한 사양을 기준으로 상담을 시작할 수 있습니다. 최종 견적은 사양 확인 후 안내드립니다.
          </p>
          <Link
            href={quoteUrl}
            className="focus-ring mt-5 inline-flex min-h-11 items-center justify-center rounded-md bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ivory"
          >
            비슷한 패키지 견적 문의하기
          </Link>
        </section>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    </main>
  );
}
