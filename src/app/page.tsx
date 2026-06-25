import Image from "next/image";
import Link from "next/link";
import { PortfolioCaseImage } from "@/components/PortfolioCaseImage";
import { QuoteInquiryForm } from "@/components/QuoteInquiryForm";
import { getPortfolioCaseUrl, getPortfolioImageAlt, parseStringList, PUBLIC_PORTFOLIO_WHERE } from "@/lib/portfolio-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const strengths = [
  "맞춤형 박스 제작",
  "고급 패키지 전문",
  "소량/대량 상담 가능",
  "제작 사양별 견적 안내",
  "샘플 기반 상담 가능"
];

const categories = [
  "싸바리박스",
  "자석박스",
  "상하짝박스",
  "서랍형박스",
  "선물세트 박스",
  "화장품 패키지",
  "건강기능식품 패키지",
  "주얼리/의류 패키지"
];

const trustCards = [
  {
    title: "브랜드 맞춤 고급 패키지",
    text: "화장품, 건강기능식품, 선물세트 등 브랜드 이미지에 맞는 패키지를 상담합니다."
  },
  {
    title: "구조와 사양 기반 견적 안내",
    text: "박스 구조, 수량, 인쇄, 후가공 조건을 확인한 뒤 현실적인 견적 범위를 안내합니다."
  },
  {
    title: "을지로 기반 패키지 제작 상담",
    text: "서울 중구 을지로를 기반으로 다양한 패키지 제작 상담을 진행합니다."
  }
];

const processSteps = [
  {
    title: "문의 접수",
    text: "제품 정보와 필요한 패키지 사양을 남겨주세요."
  },
  {
    title: "사양 확인",
    text: "사이즈, 수량, 인쇄, 후가공 조건을 확인합니다."
  },
  {
    title: "견적 안내",
    text: "상담을 통해 최종 견적을 안내드립니다."
  },
  {
    title: "제작 진행",
    text: "확정된 사양에 맞춰 제작을 진행합니다."
  },
  {
    title: "검수 및 납품",
    text: "제작 상태를 확인하고 납품 일정을 맞춥니다."
  }
];

async function getFeaturedCases() {
  try {
    return await prisma.portfolioCase.findMany({
      where: {
        ...PUBLIC_PORTFOLIO_WHERE,
        featured: true
      },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      take: 6
    });
  } catch (error) {
    console.error("[landing] Failed to load featured portfolio cases", error instanceof Error ? error.message : "unknown error");
    return [];
  }
}

export default async function LandingPage() {
  const kakaoUrl = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL;
  const featuredCases = await getFeaturedCases();

  return (
    <main className="pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/92 backdrop-blur">
        <div className="section-shell flex min-h-16 items-center justify-between gap-4">
          <a href="/" className="text-lg font-black tracking-[0.02em] text-ink">
            페르패키지
          </a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-charcoal md:flex">
            <a href="#quote" className="transition hover:text-ink">
              제작문의
            </a>
            <a href="#cases" className="transition hover:text-ink">
              제작사례
            </a>
            <a href="#process" className="transition hover:text-ink">
              진행절차
            </a>
            <a href="#consult" className="transition hover:text-ink">
              상담하기
            </a>
          </nav>
          <a
            href="#quote"
            className="focus-ring rounded-md bg-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-charcoal"
          >
            견적 문의하기
          </a>
        </div>
      </header>

      <section className="border-b border-line bg-paper">
        <div className="section-shell grid gap-10 py-14 md:grid-cols-[1.02fr_0.98fr] md:items-center md:py-20">
          <div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal text-ink [word-break:keep-all] sm:text-5xl">
              <span className="block">브랜드 가치를 높이는</span>
              <span className="block">맞춤 패키지 제작</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-700">
              싸바리박스, 자석박스, 상하짝박스, 서랍형박스 등 브랜드에 맞는 고급 패키지를 제작합니다.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#quote"
                className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-charcoal"
              >
                1분 견적 문의하기
              </a>
              {kakaoUrl ? (
                <a
                  href={kakaoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-ink bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-ivory"
                >
                  카카오톡 상담하기
                </a>
              ) : (
                <span className="inline-flex min-h-12 items-center justify-center rounded-md border border-line bg-white px-6 py-3 text-sm font-semibold text-neutral-500">
                  카카오톡 링크 설정 필요
                </span>
              )}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-8 h-28 w-28 border border-line bg-ivory" />
            <Image
              src="/images/premium-hero-products.png"
              alt="페르패키지 맞춤 패키지 제작 예시"
              width={900}
              height={675}
              priority
              className="relative z-10 aspect-[4/3] w-full rounded-lg border border-line bg-white object-cover shadow-soft"
            />
          </div>
        </div>
      </section>

      <section id="consult" className="bg-white py-14">
        <div className="section-shell">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {strengths.map((item) => (
              <article key={item} className="rounded-lg border border-line bg-paper p-5">
                <div className="mb-4 h-1.5 w-12 bg-brass" />
                <h2 className="text-base font-bold text-ink">{item}</h2>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cases" className="border-y border-line bg-ivory py-16">
        <div className="section-shell">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-ink [word-break:keep-all]">브랜드 제품에 맞는 패키지 카테고리</h2>
            <p className="mt-4 text-base leading-7 text-neutral-700">
              제품 무게, 포장 구조, 인쇄 방식, 후가공, 제작 수량을 함께 확인해 제작 가능한 사양으로 안내합니다.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <article key={category} className="rounded-lg border border-line bg-white p-5 shadow-sm">
                <p className="text-xs font-bold text-brass">{String(index + 1).padStart(2, "0")}</p>
                <h3 className="mt-4 text-lg font-bold text-ink">{category}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">
                  사이즈와 제작 목적에 맞춰 구조, 소재, 후가공을 상담합니다.
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {featuredCases.length ? (
        <section className="bg-white py-16">
          <div className="section-shell">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-black text-ink [word-break:keep-all]">대표 제작 사례</h2>
                <p className="mt-4 text-base leading-7 text-neutral-700">
                  실제 제작 사양을 바탕으로 정리한 맞춤 패키지 사례입니다.
                </p>
              </div>
              <Link
                href="/portfolio"
                className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-ink bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-ivory"
              >
                제작 사례 더보기
              </Link>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredCases.map((caseItem) => {
                const tags = parseStringList(caseItem.tags).slice(0, 3);

                return (
                  <article key={caseItem.id} className="rounded-lg border border-line bg-paper p-4">
                    <PortfolioCaseImage src={caseItem.mainImageUrl} alt={getPortfolioImageAlt(caseItem)} />
                    <div className="mt-4">
                      <p className="text-xs font-bold text-brass">
                        {caseItem.industry} · {caseItem.boxType}
                      </p>
                      <h3 className="mt-2 text-lg font-black leading-7 text-ink [word-break:keep-all]">{caseItem.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-neutral-700">{caseItem.shortDescription}</p>
                      {tags.length ? (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-charcoal">
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
          </div>
        </section>
      ) : null}

      <section className="bg-paper py-16">
        <div className="section-shell">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-ink [word-break:keep-all]">페르패키지가 잘하는 제작</h2>
            <p className="mt-4 text-base leading-7 text-neutral-700">
              단순 단가 안내보다 제작 목적과 사양을 함께 확인해 실제 제작 가능한 방향을 잡습니다.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {trustCards.map((card) => (
              <article key={card.title} className="rounded-lg border border-line bg-white p-6">
                <h3 className="text-lg font-bold text-ink">{card.title}</h3>
                <p className="mt-4 text-sm leading-6 text-neutral-700">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="border-y border-line bg-white py-16">
        <div className="section-shell">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-ink [word-break:keep-all]">제작 진행 절차</h2>
            <p className="mt-4 text-base leading-7 text-neutral-700">
              문의 접수 후 사양을 확인하고, 상담을 통해 최종 견적과 제작 일정을 안내합니다.
            </p>
          </div>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {processSteps.map((step, index) => (
              <li key={step.title} className="rounded-lg border border-line bg-paper p-5">
                <span className="text-sm font-black text-brass">STEP {index + 1}</span>
                <h3 className="mt-3 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-neutral-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="quote" className="scroll-mt-24 bg-white py-16">
        <div className="section-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <h2 className="text-3xl font-black leading-tight text-ink [word-break:keep-all]">
              제작 사양을 남겨주시면 견적 상담을 진행드립니다.
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-700">
              아직 박스 구조가 정해지지 않았어도 괜찮습니다. 제품 용도와 수량을 남겨주시면 제작 가능한 방향부터
              확인하겠습니다.
            </p>
            <div className="mt-6 rounded-lg border border-line bg-ivory p-5 text-sm leading-7 text-neutral-700">
              표시되는 예상 범위는 참고용이며, 최종 견적은 종이, 구조, 인쇄, 후가공 조건 확인 후 상담을 통해
              안내드립니다.
            </div>
          </div>
          <QuoteInquiryForm />
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 shadow-soft backdrop-blur sm:hidden">
        <a
          href="#quote"
          className="focus-ring flex min-h-12 items-center justify-center rounded-md bg-ink px-5 py-3 text-sm font-bold text-white"
        >
          견적 문의하기
        </a>
      </div>
    </main>
  );
}
