import type { Metadata } from "next";
import Link from "next/link";
import { PrintFileUploadForm } from "@/components/PrintFileUploadForm";

export const metadata: Metadata = {
  title: "인쇄파일 업로드 | 페르패키지",
  description: "고객 정보와 주문번호를 함께 남겨 페르패키지 인쇄파일을 업로드합니다."
};

export default function UploadPage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="border-b border-line bg-white">
        <div className="section-shell flex min-h-16 min-w-0 items-center justify-between gap-3">
          <Link href="/" className="min-w-0 text-lg font-black text-ink">
            페르패키지
          </Link>
          <span className="shrink-0 rounded-full border border-line bg-paper px-3 py-1 text-xs font-bold text-charcoal">
            인쇄파일 업로드
          </span>
        </div>
      </header>

      <section className="section-shell py-10 sm:py-14">
        <div className="grid min-w-0 gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
          <aside className="min-w-0 space-y-5">
            <div>
              <p className="text-sm font-bold text-brass">인쇄파일 접수</p>
              <h1 className="mt-3 text-3xl font-black leading-tight text-ink [overflow-wrap:anywhere] [word-break:keep-all] sm:text-4xl">
                고객 정보 기준 인쇄파일 업로드
              </h1>
              <p className="mt-5 text-base leading-8 text-neutral-700">
                업체명 또는 고객명, 담당자명, 연락처와 함께 인쇄파일을 접수해주세요. 주문번호가 있는 경우 함께
                남기면 담당자가 더 빠르게 확인할 수 있습니다.
              </p>
            </div>

            <div className="rounded-lg border border-line bg-white p-5 text-sm leading-7 text-charcoal">
              <h2 className="text-base font-bold text-ink">업로드 전 확인</h2>
              <ul className="mt-3 space-y-2">
                <li>인쇄용 파일은 AI, PDF, ZIP 형식을 권장합니다.</li>
                <li>최종 제작 진행 여부는 파일 확인 후 안내됩니다.</li>
                <li>제작 일정은 파일 상태와 사양에 따라 달라질 수 있습니다.</li>
                <li>업로드 후 접수 정보와 파일 목록을 보관해주세요.</li>
              </ul>
            </div>

            <div className="rounded-lg border border-line bg-ivory p-5 text-sm leading-7 text-charcoal">
              <h2 className="text-base font-bold text-ink">고객 정보 기준 관리</h2>
              <p className="mt-3">
                주문번호가 없어도 파일 접수는 가능합니다. 담당자는 업체명, 담당자명, 연락처와 파일 정보를 함께 확인해
                필요한 안내를 드립니다.
              </p>
            </div>
          </aside>

          <section className="min-w-0 rounded-lg border border-line bg-white p-5 shadow-soft sm:p-6">
            <PrintFileUploadForm />
          </section>
        </div>
      </section>
    </main>
  );
}
