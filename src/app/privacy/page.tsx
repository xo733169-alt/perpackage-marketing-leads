import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper">
      <section className="section-shell py-12 sm:py-16">
        <div className="max-w-3xl rounded-lg border border-line bg-white p-6 shadow-soft sm:p-10">
          <Link href="/#quote" className="text-sm font-semibold text-neutral-600 hover:text-ink">
            견적 문의로 돌아가기
          </Link>
          <h1 className="mt-4 text-3xl font-black text-ink">개인정보 수집 및 이용 안내</h1>
          <p className="mt-5 text-base leading-8 text-neutral-700">
            페르패키지는 견적 상담 및 제작 문의 응대를 위해 고객명, 회사명, 연락처, 이메일, 카카오톡 ID, 제작
            요청사항 등을 수집할 수 있습니다. 수집된 정보는 문의 확인, 상담 진행, 견적 안내, 재문의 응대를 위해
            사용합니다.
          </p>

          <div className="mt-8 space-y-7 text-sm leading-7 text-neutral-700">
            <section>
              <h2 className="text-lg font-bold text-ink">수집 항목</h2>
              <p className="mt-2">
                고객명, 회사명, 연락처, 이메일, 카카오톡 ID, 업종, 박스 종류, 사이즈, 제작 수량, 인쇄 여부, 후가공,
                희망 납기일, 예산 범위, 참고 이미지/링크, 추가 요청사항을 수집할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-ink">수집 목적</h2>
              <p className="mt-2">
                맞춤 패키지 제작 문의 확인, 제작 사양 상담, 견적 안내, 샘플 또는 제작 가능 여부 검토, 고객 응대 및
                재문의 관리를 위해 사용합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-ink">보관 기간</h2>
              <p className="mt-2">
                문의 및 상담 이력은 고객 응대와 재문의 관리를 위해 최대 3년간 보관될 수 있으며, 고객 요청 시 삭제할 수
                있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-ink">제3자 제공 여부</h2>
              <p className="mt-2">
                수집된 개인정보는 고객 동의 없이 외부에 제공하지 않습니다. 단, 법령에 따라 요구되는 경우는 예외로
                합니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-ink">개인정보 삭제 요청 방법</h2>
              <p className="mt-2">
                개인정보 삭제를 원하시는 경우 문의 시 남긴 연락처 또는 상담 채널을 통해 삭제 요청을 남겨주세요. 요청
                확인 후 보관 중인 문의 정보를 삭제할 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-ink">문의처</h2>
              <p className="mt-2">
                페르패키지 견적 상담 담당자에게 연락하거나 카카오톡 상담 채널을 통해 문의하실 수 있습니다.
              </p>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
