import Link from "next/link";

const nextSteps = [
  "남겨주신 제작 사양을 확인합니다.",
  "필요 시 참고 이미지나 세부 사양을 추가로 요청드립니다.",
  "종이, 구조, 인쇄, 후가공 조건을 확인한 뒤 견적을 안내드립니다."
];

export default function ThanksPage() {
  const kakaoUrl = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL;

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell flex min-h-screen items-center justify-center py-16">
        <div className="w-full max-w-2xl rounded-lg border border-line bg-white p-8 shadow-soft sm:p-10">
          <p className="text-sm font-bold text-brass">문의 접수 완료</p>
          <h1 className="mt-4 text-3xl font-black text-ink sm:text-4xl">견적 문의가 접수되었습니다.</h1>
          <p className="mt-5 text-base leading-7 text-neutral-700">
            입력해주신 내용을 확인한 뒤 빠르게 상담 도와드리겠습니다.
          </p>

          <section className="mt-8 rounded-lg border border-line bg-paper p-5">
            <h2 className="text-lg font-bold text-ink">다음 단계</h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-neutral-700">
              {nextSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="font-bold text-brass">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-6 text-neutral-600">
              최종 견적은 상담 후 사양을 확인한 뒤 안내드립니다.
            </p>
          </section>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {kakaoUrl ? (
              <a
                href={kakaoUrl}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-charcoal"
              >
                카카오톡으로 바로 상담하기
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-md bg-neutral-200 px-6 py-3 text-sm font-bold text-neutral-500"
              >
                카카오톡 채널 링크가 아직 설정되지 않았습니다.
              </button>
            )}
            <Link
              href="/"
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-ink bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-ivory"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
