import type { Metadata } from "next";
import Link from "next/link";
import { PrintFileUploadSuccessDetails } from "@/components/PrintFileUploadSuccessDetails";

export const metadata: Metadata = {
  title: "업로드 완료 | 페르패키지",
  description: "페르패키지 인쇄파일 업로드가 완료되었습니다."
};

export default function UploadSuccessPage({
  searchParams
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const orderNumber = typeof searchParams?.order === "string" ? searchParams.order : "";

  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell flex min-h-screen items-center justify-center py-12">
        <div className="w-full max-w-2xl rounded-lg border border-line bg-white p-6 shadow-soft sm:p-8">
          <p className="text-sm font-bold text-brass">인쇄파일 업로드</p>
          <h1 className="mt-3 text-3xl font-black text-ink">업로드가 완료되었습니다.</h1>
          <div className="mt-5 space-y-3 text-base leading-8 text-neutral-700">
            <p>파일이 접수되었습니다.</p>
            <p>담당자가 파일을 확인한 뒤 필요한 경우 연락드립니다.</p>
            <p>주문번호와 업로드 정보를 보관해주세요.</p>
            <p>업로드 후에도 파일 검수 과정에서 수정 요청이 발생할 수 있습니다.</p>
          </div>
          <PrintFileUploadSuccessDetails orderNumber={orderNumber} />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/upload"
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md bg-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-charcoal"
            >
              다른 파일 업로드
            </Link>
            <Link
              href="/"
              className="focus-ring inline-flex min-h-12 items-center justify-center rounded-md border border-ink bg-white px-6 py-3 text-sm font-bold text-ink transition hover:bg-ivory"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
